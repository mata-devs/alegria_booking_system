import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as QRCode from "qrcode";
import { db, storage } from "../../shared/firebase";
import { createTransporter, getFromAddress } from "../../shared/mailer";

const BOOKING_ADVANCE_DAYS = 180;
const MAX_PERSONS_PER_SLOT = 30; //this is for the time slot (should be in the dedicated `activity` collection)
const SERVICE_CHARGE_PERCENTAGE = 5; //percentage of the total price
const MIN_AGE = 10; //minimum age for the representative and guests
const MAX_SPECIAL_REQUESTS_LENGTH = 300; //maximum length of the special requests
const PHONE_PREFIX = "+63"; //phone prefix for the Philippines
const PAYMENT_HOLD_MINUTES = 24 * 60; // 24 hours for operator review
const BOOKING_ID_LENGTH = 6;
const BOOKING_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BOOKING_ID_MAX_ATTEMPTS = 5;
const TOKEN_HEX_BYTES = 12; // 24-char hex token

export type PaymentMethod = "Gcash / Maya" | "BDO" | "BPI";

interface Representative {
  fullName: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: "Male" | "Female" | "Prefer not to say";
  nationality: string;
}

interface Guest {
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Prefer not to say";
  nationality: string;
}

export interface CreateBookingInput {
  tourDate: string;
  activityId: string;
  sourceType?: "activity" | "tourPackage";
  representative: Representative;
  guests: Guest[];
  tourOperatorUid?: string;
  promoCode?: string;
  specialRequests?: string;
  paymentMethod: PaymentMethod;
  receiptDataUrl: string;
  idempotencyKey?: string;
}

type VoucherValidation = {
  discount: number;
  operatorUid?: string;
  voucherId: string;
} | null;

function normalizeDateString(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid tourDate format");
  }
  return d.toISOString().split("T")[0];
}

function toStartOfDayTimestamp(dateStr: string): Timestamp {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function buildTimeSlotId(activityId: string, tourDate: string): string {
  return `${activityId}_${tourDate}`;
}

async function getActivity(activityId: string) {
  const snap = await db.collection("activities").doc(activityId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function getTourPackage(packageId: string) {
  const snap = await db.collection("tourPackages").doc(packageId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function ensureTimeSlot(
  tx: FirebaseFirestore.Transaction,
  args: { activityId: string; tourDate: string; maxSlots: number }
) {
  const timeSlotId = buildTimeSlotId(args.activityId, args.tourDate);
  const ref = db.collection("timeslots").doc(timeSlotId);
  const snap = await tx.get(ref);

  if (!snap.exists) {
    const [year, month, day] = args.tourDate.split("-").map(Number);
    const startTime = new Date(year, month - 1, day, 8, 0, 0, 0);
    const endTime = new Date(year, month - 1, day, 17, 0, 0, 0);
    const now = FieldValue.serverTimestamp();

    tx.set(ref, {
      activityId: args.activityId,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      maxSlots: args.maxSlots,
      slotsAvailable: args.maxSlots,
      createdAt: now,
      updatedAt: now,
    });

    return { ref, data: { slotsAvailable: args.maxSlots } };
  }

  return { ref, data: snap.data() ?? { slotsAvailable: 0 } };
}

async function validatePromoCode(code: string, requiredOperatorUid?: string): Promise<VoucherValidation> {
  const voucherSnap = await db.collection("voucherCodes").where("code", "==", code).limit(1).get();
  if (voucherSnap.empty) return null;

  const voucherDoc = voucherSnap.docs[0];
  const voucher = voucherDoc.data();
  const now = new Date();

  if (voucher.voucherStatus !== "Active") return null;

  if (voucher.expirationDate) {
    const expiryDate = voucher.expirationDate.toDate?.() ?? new Date(voucher.expirationDate);
    if (expiryDate < now) return null;
  }

  if (
    typeof voucher.numberOfUsersAllowed === "number" &&
    typeof voucher.numberOfUsersUsed === "number" &&
    voucher.numberOfUsersUsed >= voucher.numberOfUsersAllowed
  ) {
    return null;
  }

  // Only accept vouchers when global (no operatorUid) or matching the source owner operator.
  if (requiredOperatorUid !== undefined) {
    const voucherOperatorUid = typeof voucher.operatorUid === "string" && voucher.operatorUid ? voucher.operatorUid : null;
    if (voucherOperatorUid && voucherOperatorUid !== requiredOperatorUid) {
      return null;
    }
  }

  return {
    discount: Number(voucher.discount) || 0,
    operatorUid: typeof voucher.operatorUid === "string" ? voucher.operatorUid : undefined,
    voucherId: voucherDoc.id,
  };
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer; extension: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid receiptDataUrl format");
  }

  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0) {
    throw new Error("Receipt file is empty");
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Receipt image must be 5MB or smaller");
  }

  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(mime)) {
    throw new Error("Invalid receiptDataUrl format");
  }

  let extension = "jpg";
  if (mime === "image/png") extension = "png";
  if (mime === "image/webp") extension = "webp";

  return { mime, buffer, extension };
}

/**
 * Signed URLs need a service account (client_email + private_key). Local ADC from
 * `gcloud auth application-default login` cannot sign — use the Storage emulator HTTP URL instead.
 * @see https://firebase.google.com/docs/emulator-suite/connect_storage#admin_sdks
 */
function buildStorageEmulatorReadUrl(bucketName: string, filePath: string): string {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (!emulatorHost) {
    throw new Error("STORAGE_EMULATOR_HOST is not set");
  }
  const origin = emulatorHost.includes("://") ? emulatorHost : `http://${emulatorHost}`;
  const encPath = encodeURIComponent(filePath);
  const encBucket = encodeURIComponent(bucketName);
  return `${origin}/v0/b/${encBucket}/o/${encPath}?alt=media`;
}

async function uploadReceiptImage(bookingId: string, receiptDataUrl: string): Promise<{
  receiptUrl: string;
  filePath: string;
}> {
  const { mime, buffer, extension } = parseDataUrl(receiptDataUrl);
  const now = Date.now();
  const filePath = `bookings/${bookingId}/receipts/${now}.${extension}`;
  const bucket = storage.bucket();
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: { contentType: mime },
    resumable: false,
  });

  if (process.env.STORAGE_EMULATOR_HOST) {
    return {
      receiptUrl: buildStorageEmulatorReadUrl(bucket.name, filePath),
      filePath,
    };
  }

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: "2100-01-01",
  });

  return { receiptUrl: signedUrl, filePath };
}

function calculatePricing(numberOfGuests: number, pricePerGuest: number, discount = 0) {
  const baseAmount = numberOfGuests * pricePerGuest;
  const serviceCharge = (baseAmount * SERVICE_CHARGE_PERCENTAGE) / 100;
  const subtotal = baseAmount + serviceCharge;
  const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0;
  const finalPrice = subtotal - discountAmount;

  return {
    pricePerGuest,
    baseAmount,
    serviceCharge,
    subtotal,
    discountPercentage: discount,
    discountAmount,
    finalPrice,
  };
}

function generateBookingCode(length = BOOKING_ID_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * BOOKING_ID_CHARS.length);
    code += BOOKING_ID_CHARS[idx];
  }
  return code;
}

function generateHexToken(bytes = TOKEN_HEX_BYTES): string {
  return Buffer.from(Array.from({ length: bytes }, () => Math.floor(Math.random() * 256))).toString("hex");
}

function isAlreadyExistsError(error: unknown): boolean {
  const err = error as { code?: number | string; message?: string };
  return (
    err?.code === 6 ||
    err?.code === "already-exists" ||
    err?.message?.toLowerCase().includes("already exists") === true
  );
}

function validateCreateInput(data: CreateBookingInput) {
  if (!data.activityId || !data.tourDate || !data.representative) {
    throw new Error("Missing required fields: activityId, tourDate, representative");
  }
  if (!Array.isArray(data.guests)) {
    throw new Error("guests must be an array");
  }
  if (!data.representative.fullName || !data.representative.email || !data.representative.phoneNumber) {
    throw new Error("Invalid representative info");
  }
  if (!data.representative.phoneNumber.startsWith(PHONE_PREFIX)) {
    throw new Error(`Phone number must start with ${PHONE_PREFIX}`);
  }
  if (!Number.isFinite(data.representative.age) || data.representative.age < MIN_AGE) {
    throw new Error(`Representative age must be at least ${MIN_AGE}`);
  }
  if (data.guests.some((guest) => !Number.isFinite(guest.age) || guest.age < MIN_AGE)) {
    throw new Error(`All guest ages must be at least ${MIN_AGE}`);
  }
  if ((data.specialRequests ?? "").length > MAX_SPECIAL_REQUESTS_LENGTH) {
    throw new Error(`specialRequests must be ${MAX_SPECIAL_REQUESTS_LENGTH} characters or fewer`);
  }
  if (!data.receiptDataUrl) {
    throw new Error("receiptDataUrl is required");
  }
  if (!data.paymentMethod) {
    throw new Error("paymentMethod is required");
  }
}

export async function createBooking(data: CreateBookingInput) {
  validateCreateInput(data);

  const normalizedDate = normalizeDateString(data.tourDate);
  const tourDateTs = toStartOfDayTimestamp(normalizedDate);

  const daysDiff = Math.floor((tourDateTs.toMillis() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 0 || daysDiff > BOOKING_ADVANCE_DAYS) {
    throw new Error(`Booking must be within ${BOOKING_ADVANCE_DAYS} days in advance`);
  }

  const isTourPackage = data.sourceType === "tourPackage";

  let pricePerGuest: number;
  let sourceOperatorId: string | undefined;
  let sourceDisplayName: string | undefined;
  let maxSlotsForSource: number;

  if (isTourPackage) {
    const tourPkg = (await getTourPackage(data.activityId)) as
      | (Record<string, unknown> & { pricePerPerson?: number; operatorId?: string; status?: string; packageName?: string; maximumNumberOfPeople?: number })
      | null;
    if (!tourPkg) throw new Error("Tour package not found");
    if (tourPkg.status !== "active") throw new Error("Tour package is not active");
    pricePerGuest = Number(tourPkg.pricePerPerson) || 0;
    sourceOperatorId = typeof tourPkg.operatorId === "string" ? tourPkg.operatorId : undefined;
    sourceDisplayName = typeof tourPkg.packageName === "string" ? tourPkg.packageName : undefined;
    maxSlotsForSource = Number(tourPkg.maximumNumberOfPeople) || MAX_PERSONS_PER_SLOT;
  } else {
    const activity = (await getActivity(data.activityId)) as
      | (Record<string, unknown> & { maxSlots?: number; pricePerGuest?: number; status?: string; activityName?: string; operatorId?: string })
      | null;
    if (!activity) throw new Error("Activity not found");
    if (activity.status !== "active") throw new Error("Activity is not active");
    pricePerGuest = Number(activity.pricePerGuest) || 0;
    sourceOperatorId = typeof activity.operatorId === "string" ? activity.operatorId : undefined;
    sourceDisplayName = typeof activity.activityName === "string" ? activity.activityName : undefined;
    maxSlotsForSource = Number(activity.maxSlots) || MAX_PERSONS_PER_SLOT;
  }

  if (!sourceOperatorId) {
    throw new Error(isTourPackage ? "Tour package has no assigned operator" : "Activity has no assigned operator");
  }

  const numberOfGuests = data.guests.length + 1;
  if (numberOfGuests > MAX_PERSONS_PER_SLOT) {
    throw new Error(`Maximum ${MAX_PERSONS_PER_SLOT} persons per slot`);
  }

  const promoData = data.promoCode
    ? await validatePromoCode(data.promoCode, sourceOperatorId)
    : null;
  if (data.promoCode && !promoData) {
    throw new Error("Invalid or expired promo code");
  }

  const pricing = calculatePricing(numberOfGuests, pricePerGuest, promoData?.discount ?? 0);

  const operatorUid = sourceOperatorId;
  const assignmentType = promoData?.operatorUid ? "voucher" : "source-owner";

  if (data.idempotencyKey) {
    const existing = await db
      .collection("bookings")
      .where("idempotencyKey", "==", data.idempotencyKey)
      .limit(1)
      .get();
    if (!existing.empty) {
      const booking = existing.docs[0].data() as any;
      return {
        bookingId: existing.docs[0].id,
        status: booking.status,
        operatorUid: booking.operatorUid,
        paymentExpiresAt: booking.paymentExpiresAt ?? null,
        activityName: sourceDisplayName ?? data.activityId,
        numberOfGuests: booking.numberOfGuests ?? data.guests.length + 1,
        pricing,
      };
    }
  }

  const timeSlotId = buildTimeSlotId(data.activityId, normalizedDate);
  const maxSlots = maxSlotsForSource;

  const paymentRef = db.collection("payments").doc();
  const paymentDocId = paymentRef.id;
  const checkInToken = generateHexToken();
  const reviewToken = generateHexToken();

  const nowMs = Date.now();
  const paymentExpiresAtTs = Timestamp.fromMillis(
    nowMs + PAYMENT_HOLD_MINUTES * 60 * 1000
  );

  for (let attempt = 1; attempt <= BOOKING_ID_MAX_ATTEMPTS; attempt++) {
    const bookingDocId = generateBookingCode();
    const bookingRef = db.collection("bookings").doc(bookingDocId);
    const receiptUpload = await uploadReceiptImage(bookingDocId, data.receiptDataUrl);

    try {
      await db.runTransaction(async (tx) => {
        const ensuredSlot = await ensureTimeSlot(tx, {
          activityId: data.activityId,
          tourDate: normalizedDate,
          maxSlots,
        });

        const slotsAvailable = Number(ensuredSlot.data.slotsAvailable) || 0;
        if (slotsAvailable < numberOfGuests) {
          throw new Error("Insufficient slots available");
        }

        const now = FieldValue.serverTimestamp();

        tx.create(bookingRef, {
          bookingId: bookingDocId,
          representative: data.representative,
          guests: data.guests,
          specialRequests: data.specialRequests ?? "",
          activityId: data.activityId,
          activityName: sourceDisplayName ?? data.activityId,
          sourceType: data.sourceType ?? "activity",
          timeSlotId,
          tourDate: tourDateTs,
          status: "reserved",
          numberOfGuests,
          operatorUid,
          assignmentType,
          paymentMethod: data.paymentMethod,
          promoCode: data.promoCode ?? null,
          idempotencyKey: data.idempotencyKey ?? null,
          ...pricing,
          receiptUrl: receiptUpload.receiptUrl,
          checkInToken,
          reviewToken,
          reviewSentAt: null,
          reviewSubmittedAt: null,
          tourStartedAt: null,
          durationMinutes: null,
          paymentStatus: "pending",
          paymentExpiresAt: paymentExpiresAtTs,
          paymentId: paymentDocId,
          createdAt: now,
          updatedAt: now,
        });

        tx.update(ensuredSlot.ref, {
          slotsAvailable: slotsAvailable - numberOfGuests,
          updatedAt: now,
        });

        if (promoData?.voucherId) {
          tx.update(db.collection("voucherCodes").doc(promoData.voucherId), {
            numberOfUsersUsed: FieldValue.increment(1),
            updatedAt: now,
          });
        }

        tx.set(paymentRef, {
          paymentId: paymentDocId,
          bookingId: bookingDocId,
          amount: pricing.finalPrice,
          paymentMethod: data.paymentMethod,
          status: "pending",
          receiptUrl: receiptUpload.receiptUrl,
          expiresAt: paymentExpiresAtTs,
          createdAt: now,
          updatedAt: now,
        });
      });

      return {
        bookingId: bookingDocId,
        status: "reserved",
        operatorUid,
        paymentExpiresAt: paymentExpiresAtTs,
        activityName: sourceDisplayName ?? data.activityId,
        numberOfGuests,
        pricing,
      };
    } catch (err) {
      // Transaction failed after receipt already uploaded: delete orphan to keep storage clean.
      try {
        await storage.bucket().file(receiptUpload.filePath).delete({ ignoreNotFound: true });
      } catch {
        // ignore cleanup errors
      }

      if (isAlreadyExistsError(err) && attempt < BOOKING_ID_MAX_ATTEMPTS) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not generate unique booking ID");
}

export async function expireUnpaidBookings(batchLimit = 20) {
  const nowMs = Date.now();
  const candidatesSnap = await db
    .collection("bookings")
    .where("status", "==", "reserved")
    .where("paymentStatus", "==", "pending")
    .limit(batchLimit)
    .get();

  for (const docSnap of candidatesSnap.docs) {
    const bookingId = docSnap.id;
    const data = docSnap.data() as any;

    const paymentExpiresAt = data.paymentExpiresAt;
    if (!paymentExpiresAt || !paymentExpiresAt.toMillis || paymentExpiresAt.toMillis() > nowMs) {
      continue;
    }

    const timeSlotId = data.timeSlotId as string | undefined;
    const numberOfGuests = Number(data.numberOfGuests) || 0;
    const promoCode = typeof data.promoCode === "string" ? data.promoCode : null;

    let voucherRef: FirebaseFirestore.DocumentReference | null = null;
    if (promoCode) {
      const voucherSnap = await db.collection("voucherCodes").where("code", "==", promoCode).limit(1).get();
      if (!voucherSnap.empty) {
        voucherRef = db.collection("voucherCodes").doc(voucherSnap.docs[0].id);
      }
    }
    const paymentsSnap = await db.collection("payments").where("bookingId", "==", bookingId).get();
    const paymentRefs = paymentsSnap.docs.map((p) => db.collection("payments").doc(p.id));

    const nowTs = Timestamp.fromMillis(nowMs);
    await db.runTransaction(async (tx) => {
      const bookingRef = db.collection("bookings").doc(bookingId);
      const freshSnap = await tx.get(bookingRef);
      if (!freshSnap.exists) return;
      const fresh = freshSnap.data() as any;

      if (fresh.paymentStatus !== "pending") return;
      if (!fresh.paymentExpiresAt || fresh.paymentExpiresAt.toMillis() > nowMs) return;

      if (timeSlotId) {
        const slotRef = db.collection("timeslots").doc(timeSlotId);
        tx.update(slotRef, {
          slotsAvailable: FieldValue.increment(numberOfGuests),
          updatedAt: nowTs,
        });
      }

      tx.update(bookingRef, {
        status: "cancelled",
        paymentStatus: "expired",
        paymentExpiredAt: nowTs,
        updatedAt: nowTs,
      });

      for (const paymentRef of paymentRefs) {
        tx.update(paymentRef, {
          status: "expired",
          updatedAt: nowTs,
        });
      }

      if (voucherRef) {
        const voucherSnapFresh = await tx.get(voucherRef);
        const current = Number(voucherSnapFresh.data()?.numberOfUsersUsed) || 0;
        tx.update(voucherRef, {
          numberOfUsersUsed: Math.max(0, current - 1),
          updatedAt: nowTs,
        });
      }
    });

    // Send expiry/cancellation email — fire-and-forget
    const rep = data.representative as { fullName?: string; email?: string } | undefined;
    if (rep?.email) {
      const tourDate: Date | null = data.tourDate?.toDate?.() ?? null;
      const tourDateFormatted = tourDate
        ? tourDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })
        : "—";
      const opInfo = await getOperatorContact(data.operatorUid ?? "").catch(() => null);

      createTransporter().sendMail({
        from: getFromAddress(),
        to: rep.email,
        subject: `Reservation Expired – ${bookingId}`,
        html: `
          <div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#1f2937">
            <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="margin:0;color:#fff;font-size:22px">Reservation Expired</h1>
              <p style="margin:6px 0 0;color:#fecaca;font-size:14px">Booking ID: <strong>${bookingId}</strong></p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:28px 32px">
              <p style="margin:0 0 20px">Hi <strong>${rep.fullName ?? "Guest"}</strong>, your reservation has <strong>expired</strong> because payment was not verified within the required time.</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                ${data.activityName ? `
                <tr>
                  <td style="padding:6px 0;color:#6b7280;width:42%">${data.sourceType === "tourPackage" ? "Tour Package" : "Activity"}</td>
                  <td style="padding:6px 0;font-weight:600">${data.activityName}</td>
                </tr>` : ""}
                <tr style="${data.activityName ? "border-top:1px solid #f3f4f6" : ""}">
                  <td style="padding:6px 0;color:#6b7280">Tour Date</td>
                  <td style="padding:6px 0">${tourDateFormatted}</td>
                </tr>
                <tr style="border-top:1px solid #f3f4f6">
                  <td style="padding:6px 0;color:#6b7280">Guests</td>
                  <td style="padding:6px 0">${data.numberOfGuests ?? "—"}</td>
                </tr>
              </table>
              ${opInfo ? `
              <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Tour Operator</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                ${opInfo.companyName ? `<tr><td style="padding:5px 0;color:#6b7280;width:42%">Company</td><td style="padding:5px 0;font-weight:600">${opInfo.companyName}</td></tr>` : ""}
                ${opInfo.phoneNumber ? `<tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Phone</td><td style="padding:5px 0">${opInfo.phoneNumber}</td></tr>` : ""}
                ${opInfo.email ? `<tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Email</td><td style="padding:5px 0">${opInfo.email}</td></tr>` : ""}
              </table>` : ""}
              <p style="margin:0;font-size:13px;color:#6b7280">If you still wish to book, please start a new reservation. We apologize for the inconvenience.</p>
            </div>
          </div>
        `,
      }).catch(() => { /* ignore */ });
    }
  }
}

export async function getOperatorContact(operatorUid: string): Promise<{ companyName: string; phoneNumber: string; email: string } | null> {
  try {
    const snap = await db.doc(`users/${operatorUid}`).get();
    if (!snap.exists) return null;
    const d = snap.data() as Record<string, unknown>;
    return {
      companyName: typeof d.companyName === "string" ? d.companyName : "",
      phoneNumber: typeof d.phoneNumber === "string" ? d.phoneNumber : "",
      email: typeof d.email === "string" ? d.email : "",
    };
  } catch {
    return null;
  }
}

export async function confirmPayment(bookingId: string) {
  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) throw new Error("Booking not found");

  const booking = snap.data() as any;
  const opInfo = await getOperatorContact(booking.operatorUid ?? "");

  const now = FieldValue.serverTimestamp();
  await bookingRef.update({ status: "paid", paymentStatus: "paid", updatedAt: now });

  if (booking.paymentId) {
    await db.collection("payments").doc(booking.paymentId).update({ status: "paid", updatedAt: now });
  }

  const rep = booking.representative as {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    age?: number;
    gender?: string;
    nationality?: string;
  } | undefined;

  if (rep?.email) {
    const tourDate: Date | null = booking.tourDate?.toDate?.() ?? null;
    const tourDateFormatted = tourDate
      ? tourDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })
      : "—";

    const fmt = (n: number) =>
      `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const qrPayload = JSON.stringify({
      bookingId,
      token: booking.checkInToken ?? null,
    });
    const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 220, margin: 2 });

    await createTransporter().sendMail({
      from: getFromAddress(),
      to: rep.email,
      subject: `Booking Confirmed – ${bookingId}`,
      html: `
        <div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#1f2937">

          <div style="background:#558B2F;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#fff;font-size:22px">Booking Confirmed!</h1>
            <p style="margin:6px 0 0;color:#d9f99d;font-size:14px">Booking ID: <strong>${bookingId}</strong></p>
          </div>

          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:28px 32px">

            <p style="margin:0 0 20px">Hi <strong>${rep.fullName ?? "Guest"}</strong>, your payment has been verified and your booking is now <strong>confirmed</strong>.</p>

            <!-- QR Code -->
            <div style="text-align:center;margin:0 0 28px">
              <p style="margin:0 0 10px;font-size:13px;color:#6b7280">Present this QR code on the day of your tour</p>
              <img src="cid:booking-qr" alt="Booking QR Code" width="160" style="border:6px solid #f3f4f6;border-radius:8px" />
              <p style="margin:8px 0 0;font-size:16px;font-weight:700;letter-spacing:.1em;color:#1f2937">${bookingId}</p>
            </div>

            <!-- Booking Details -->
            <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Booking Details</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
              ${booking.activityName ? `
              <tr>
                <td style="padding:6px 0;color:#6b7280;width:42%">${booking.sourceType === "tourPackage" ? "Tour Package" : "Activity"}</td>
                <td style="padding:6px 0;font-weight:600">${booking.activityName}</td>
              </tr>` : ""}
              <tr style="${booking.activityName ? "border-top:1px solid #f3f4f6" : ""}">
                <td style="padding:6px 0;color:#6b7280;width:42%">Tour Date</td>
                <td style="padding:6px 0;font-weight:600">${tourDateFormatted}</td>
              </tr>
              <tr style="border-top:1px solid #f3f4f6">
                <td style="padding:6px 0;color:#6b7280">Guests</td>
                <td style="padding:6px 0">${booking.numberOfGuests ?? "—"}</td>
              </tr>
              <tr style="border-top:1px solid #f3f4f6">
                <td style="padding:6px 0;color:#6b7280">Payment Method</td>
                <td style="padding:6px 0">${booking.paymentMethod ?? "—"}</td>
              </tr>
              <tr style="border-top:1px solid #f3f4f6">
                <td style="padding:6px 0;color:#6b7280">Status</td>
                <td style="padding:6px 0"><span style="background:#dcfce7;color:#14532d;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">Confirmed & Paid</span></td>
              </tr>
            </table>

            <!-- Tour Operator -->
            ${opInfo ? `
            <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Tour Operator</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
              ${opInfo.companyName ? `<tr><td style="padding:5px 0;color:#6b7280;width:42%">Company</td><td style="padding:5px 0;font-weight:600">${opInfo.companyName}</td></tr>` : ""}
              ${opInfo.phoneNumber ? `<tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Phone</td><td style="padding:5px 0">${opInfo.phoneNumber}</td></tr>` : ""}
              ${opInfo.email ? `<tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Email</td><td style="padding:5px 0">${opInfo.email}</td></tr>` : ""}
            </table>` : ""}

            <!-- Representative -->
            <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Representative</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
              <tr><td style="padding:5px 0;color:#6b7280;width:42%">Name</td><td style="padding:5px 0">${rep.fullName ?? "—"}</td></tr>
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Email</td><td style="padding:5px 0">${rep.email}</td></tr>
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Phone</td><td style="padding:5px 0">${rep.phoneNumber ?? "—"}</td></tr>
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Age / Gender</td><td style="padding:5px 0">${rep.age ?? "—"} yrs · ${rep.gender ?? "—"}</td></tr>
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:5px 0;color:#6b7280">Nationality</td><td style="padding:5px 0">${rep.nationality ?? "—"}</td></tr>
            </table>

            <!-- Guests -->
            ${Array.isArray(booking.guests) && booking.guests.length > 0 ? `
            <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Additional Guests (${booking.guests.length})</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
              ${(booking.guests as { fullName: string; age: number; gender: string; nationality: string }[]).map((g, i: number) => `
              <tr style="${i > 0 ? "border-top:1px solid #f3f4f6" : ""}">
                <td style="padding:5px 0;color:#6b7280;width:42%">Guest ${i + 1}</td>
                <td style="padding:5px 0">${g.fullName} · ${g.age} yrs · ${g.gender} · ${g.nationality}</td>
              </tr>`).join("")}
            </table>` : ""}

            <!-- Payment Breakdown -->
            <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Payment Summary</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#6b7280;width:42%">Price per Guest</td><td style="padding:6px 0">${fmt(booking.pricePerGuest ?? 0)} × ${booking.numberOfGuests ?? 1}</td></tr>
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:6px 0;color:#6b7280">Base Amount</td><td style="padding:6px 0">${fmt(booking.baseAmount ?? 0)}</td></tr>
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:6px 0;color:#6b7280">Service Charge (5%)</td><td style="padding:6px 0">${fmt(booking.serviceCharge ?? 0)}</td></tr>
              ${(booking.discountAmount ?? 0) > 0 ? `
              <tr style="border-top:1px solid #f3f4f6"><td style="padding:6px 0;color:#6b7280">Discount (${booking.discountPercentage ?? 0}%${booking.promoCode ? ` · ${booking.promoCode}` : ""})</td><td style="padding:6px 0;color:#16a34a">− ${fmt(booking.discountAmount)}</td></tr>` : ""}
              <tr style="border-top:2px solid #e5e7eb">
                <td style="padding:10px 0;font-weight:700;font-size:15px">Total Paid</td>
                <td style="padding:10px 0;font-weight:700;font-size:15px;color:#558B2F">${fmt(booking.finalPrice ?? 0)}</td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#6b7280">Thank you for booking with us. We look forward to seeing you on your tour day!</p>
          </div>

        </div>
      `,
      attachments: [
        {
          filename: `booking-${bookingId}-qr.png`,
          content: qrBuffer,
          cid: "booking-qr",
        },
      ],
    });
  }

  return { bookingId };
}
