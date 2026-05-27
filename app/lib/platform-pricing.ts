import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { firebaseDb } from './firebase'

export const PLATFORM_PRICING_COLLECTION = 'app_config'
export const PLATFORM_PRICING_DOC_ID = 'pricing'
export const DEFAULT_SERVICE_CHARGE_PER_BOOKING = 500
export const MAX_SERVICE_CHARGE_PER_BOOKING = 100_000

export type PlatformPricing = {
  serviceChargePerBooking: number
  updatedAt: number | null
  updatedBy: string | null
}

export const DEFAULT_PLATFORM_PRICING: PlatformPricing = {
  serviceChargePerBooking: DEFAULT_SERVICE_CHARGE_PER_BOOKING,
  updatedAt: null,
  updatedBy: null,
}

function toMillisSafe(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis()
  if (value && typeof value === 'object' && 'toMillis' in value) {
    try {
      const v = (value as { toMillis: () => number }).toMillis()
      return typeof v === 'number' ? v : null
    } catch {
      return null
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

export function parsePlatformPricing(raw: DocumentData | null | undefined): PlatformPricing {
  if (!raw) return DEFAULT_PLATFORM_PRICING
  const amount = Number(raw.serviceChargePerBooking)
  return {
    serviceChargePerBooking:
      Number.isFinite(amount) && amount >= 0
        ? Math.min(amount, MAX_SERVICE_CHARGE_PER_BOOKING)
        : DEFAULT_SERVICE_CHARGE_PER_BOOKING,
    updatedAt: toMillisSafe(raw.updatedAt),
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : null,
  }
}

export function validateServiceChargePerBooking(amount: number): string | null {
  if (!Number.isFinite(amount)) return 'Enter a valid amount.'
  if (amount < 0) return 'Amount cannot be negative.'
  if (amount > MAX_SERVICE_CHARGE_PER_BOOKING) {
    return `Amount cannot exceed ₱${MAX_SERVICE_CHARGE_PER_BOOKING.toLocaleString('en-PH')}.`
  }
  return null
}

function platformPricingDocRef() {
  return doc(firebaseDb, PLATFORM_PRICING_COLLECTION, PLATFORM_PRICING_DOC_ID)
}

export async function getPlatformPricing(): Promise<PlatformPricing> {
  const snap = await getDoc(platformPricingDocRef())
  if (!snap.exists()) return DEFAULT_PLATFORM_PRICING
  return parsePlatformPricing(snap.data())
}

export function subscribePlatformPricing(
  cb: (pricing: PlatformPricing) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    platformPricingDocRef(),
    (snap) => cb(snap.exists() ? parsePlatformPricing(snap.data()) : DEFAULT_PLATFORM_PRICING),
    (err) => onError?.(err),
  )
}

export async function setServiceChargePerBooking(amount: number, uid: string): Promise<void> {
  const err = validateServiceChargePerBooking(amount)
  if (err) throw new Error(err)
  await setDoc(
    platformPricingDocRef(),
    {
      serviceChargePerBooking: amount,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true },
  )
}

/** Matches backend `calculatePricing` (discount applied to subtotal incl. convenience fee). */
export function computeBookingTotals(
  baseAmount: number,
  serviceChargePerBooking: number,
  discountPercent: number | null | undefined,
) {
  const serviceCharge = serviceChargePerBooking
  const subtotal = baseAmount + serviceCharge
  const discount = discountPercent && discountPercent > 0 ? discountPercent : 0
  const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0
  const total = subtotal - discountAmount
  return { baseAmount, serviceCharge, subtotal, discountAmount, discountPercent: discount, total }
}
