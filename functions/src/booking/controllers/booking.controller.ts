import type { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import * as BookingService from "../services/booking.service";
import { createTransporter, getFromAddress } from "../../shared/mailer";

export async function create(req: Request, res: Response) {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];
    const payload = {
      ...req.body,
      idempotencyKey:
        typeof idempotencyKey === "string"
          ? idempotencyKey
          : Array.isArray(idempotencyKey)
            ? idempotencyKey[0]
            : undefined,
    } as BookingService.CreateBookingInput;

    if (!payload.receiptDataUrl || typeof payload.receiptDataUrl !== "string") {
      res.status(400).json({ error: "receiptDataUrl is required" });
      return;
    }
    if (!payload.paymentMethod || typeof payload.paymentMethod !== "string") {
      res.status(400).json({ error: "paymentMethod is required" });
      return;
    }

    const result = await BookingService.createBooking(payload);

    // Send acknowledgement email — fire-and-forget, never block the response
    const rep = payload.representative;
    if (rep?.email) {
      const tourDateFormatted = new Date(payload.tourDate).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila",
      });

      const { pricing, activityName, numberOfGuests } = result;
      const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const guestRows = payload.guests.length > 0
        ? payload.guests.map((g, i) => `
            <tr style="border-top:1px solid #f3f4f6">
              <td style="padding:6px 0;color:#6b7280">Guest ${i + 1}</td>
              <td style="padding:6px 0">${g.fullName} · ${g.age} yrs · ${g.gender} · ${g.nationality}</td>
            </tr>`).join("")
        : `<tr><td colspan="2" style="padding:6px 0;color:#9ca3af;font-style:italic">No additional guests</td></tr>`;

      createTransporter()
        .sendMail({
          from: getFromAddress(),
          to: rep.email,
          subject: `Booking Received – ${result.bookingId}`,
          html: `
            <div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#1f2937">

              <div style="background:#558B2F;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="margin:0;color:#fff;font-size:22px">Reservation Received!</h1>
                <p style="margin:6px 0 0;color:#d9f99d;font-size:14px">Booking ID: <strong>${result.bookingId}</strong></p>
              </div>

              <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:28px 32px">

                <p style="margin:0 0 20px">Hi <strong>${rep.fullName}</strong>, your booking is <strong>reserved</strong> while our operator verifies your payment.</p>

                <!-- Booking Details -->
                <h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Booking Details</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;width:42%">Activity</td>
                    <td style="padding:6px 0;font-weight:600">${activityName}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Tour Date</td>
                    <td style="padding:6px 0;font-weight:600">${tourDateFormatted}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Payment Method</td>
                    <td style="padding:6px 0">${payload.paymentMethod}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Status</td>
                    <td style="padding:6px 0"><span style="background:#fef9c3;color:#713f12;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">Reserved – pending payment validation</span></td>
                  </tr>
                  ${payload.specialRequests ? `
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Special Requests</td>
                    <td style="padding:6px 0">${payload.specialRequests}</td>
                  </tr>` : ""}
                </table>

                <!-- Representative -->
                <h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Representative</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;width:42%">Full Name</td>
                    <td style="padding:6px 0">${rep.fullName}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Email</td>
                    <td style="padding:6px 0">${rep.email}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Phone</td>
                    <td style="padding:6px 0">${rep.phoneNumber}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Age / Gender</td>
                    <td style="padding:6px 0">${rep.age} yrs · ${rep.gender}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Nationality</td>
                    <td style="padding:6px 0">${rep.nationality}</td>
                  </tr>
                </table>

                <!-- Guests -->
                <h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Guests (${numberOfGuests} total incl. representative)</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                  ${guestRows}
                </table>

                <!-- Payment Breakdown -->
                <h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;color:#558B2F;letter-spacing:.05em">Payment Breakdown</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;width:42%">Price per Guest</td>
                    <td style="padding:6px 0">${fmt(pricing.pricePerGuest)} × ${numberOfGuests}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Base Amount</td>
                    <td style="padding:6px 0">${fmt(pricing.baseAmount)}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Service Charge (5%)</td>
                    <td style="padding:6px 0">${fmt(pricing.serviceCharge)}</td>
                  </tr>
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Subtotal</td>
                    <td style="padding:6px 0">${fmt(pricing.subtotal)}</td>
                  </tr>
                  ${pricing.discountAmount > 0 ? `
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:6px 0;color:#6b7280">Discount (${pricing.discountPercentage}%${payload.promoCode ? ` · ${payload.promoCode}` : ""})</td>
                    <td style="padding:6px 0;color:#16a34a">− ${fmt(pricing.discountAmount)}</td>
                  </tr>` : ""}
                  <tr style="border-top:2px solid #e5e7eb">
                    <td style="padding:10px 0;font-weight:700;font-size:15px">Total</td>
                    <td style="padding:10px 0;font-weight:700;font-size:15px;color:#558B2F">${fmt(pricing.finalPrice)}</td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:13px;color:#6b7280">
                  Our operator will review your payment receipt and confirm your booking shortly.
                  You will receive another email once confirmed.
                </p>
              </div>

            </div>
          `,
        })
        .catch((err) => logger.warn("Booking acknowledgement email failed", { bookingId: result.bookingId, err }));
    }

    res.status(201).json({
      message: "Booking created",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    const clientErrors = [
      "Missing required fields",
      "Invalid representative info",
      "guests must be an array",
      "Booking must be within",
      "Activity not found",
      "Activity is not active",
      "Maximum",
      "Invalid or expired promo code",
      "No active operators available",
      "Insufficient slots available",
      "Invalid tourDate format",
      "Phone number must start with",
      "Representative age must be at least",
      "All guest ages must be at least",
      "specialRequests must be",
      "paymentMethod is required",
      "receiptDataUrl is required",
      "Invalid receiptDataUrl format",
      "Receipt file is empty",
      "Receipt image must be 5MB or smaller",
    ];
    const status = clientErrors.some((prefix) => message.includes(prefix)) ? 400 : 500;
    res.status(status).json({ error: message });
  }
}

export async function confirm(req: Request, res: Response) {
  try {
    const { bookingId } = req.params as { bookingId: string };
    if (!bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }
    const result = await BookingService.confirmPayment(bookingId);
    res.status(200).json({ message: "Booking confirmed", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm booking";
    const status = message.includes("Booking not found") ? 404 : 500;
    res.status(status).json({ error: message });
  }
}
