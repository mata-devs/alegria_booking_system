/** Voucher discount type — percent off subtotal or fixed peso amount (capped at subtotal). */

export type VoucherDiscountType = 'percent' | 'fixed'

export type VoucherDiscount = {
  discountType: VoucherDiscountType
  discountValue: number
}

export type BookingDiscount = VoucherDiscount

export const MAX_FIXED_DISCOUNT_PESO = 100_000

export function parseVoucherDiscount(data: Record<string, unknown>): VoucherDiscount {
  const rawType = data.discountType
  const discountType: VoucherDiscountType = rawType === 'fixed' ? 'fixed' : 'percent'
  const discountValue = Number(
    data.discountValue !== undefined && data.discountValue !== null
      ? data.discountValue
      : data.discount,
  )
  return {
    discountType,
    discountValue: Number.isFinite(discountValue) ? discountValue : 0,
  }
}

export function voucherDiscountToFirestoreFields(
  discountType: VoucherDiscountType,
  discountValue: number,
): Record<string, unknown> {
  return {
    discountType,
    discountValue,
    /** Legacy readers — percent only */
    discount: discountType === 'percent' ? discountValue : 0,
  }
}

export function validateVoucherDiscountInput(
  discountType: VoucherDiscountType,
  rawValue: string,
): string | null {
  const trimmed = rawValue.trim()
  if (!trimmed) return 'Discount value is required.'

  if (discountType === 'percent') {
    const n = Number(trimmed)
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      return 'Percentage must be an integer from 1 to 100.'
    }
    return null
  }

  const n = parseFloat(trimmed)
  if (!Number.isFinite(n) || n <= 0) return 'Enter a positive peso amount.'
  if (Math.round(n * 100) !== n * 100) return 'Use at most 2 decimal places.'
  if (n > MAX_FIXED_DISCOUNT_PESO) {
    return `Amount cannot exceed ₱${MAX_FIXED_DISCOUNT_PESO.toLocaleString('en-PH')}.`
  }
  return null
}

export function parseVoucherDiscountValue(
  discountType: VoucherDiscountType,
  rawValue: string,
): number {
  if (discountType === 'percent') return parseInt(rawValue.trim(), 10) || 0
  return Math.round(parseFloat(rawValue.trim()) * 100) / 100
}

export function computeDiscountAmount(
  subtotal: number,
  discount: BookingDiscount | null | undefined,
): number {
  if (!discount || discount.discountValue <= 0 || subtotal <= 0) return 0
  if (discount.discountType === 'percent') {
    return (subtotal * discount.discountValue) / 100
  }
  return Math.min(discount.discountValue, subtotal)
}

export function formatVoucherDiscountLabel(discount: VoucherDiscount): string {
  if (discount.discountType === 'fixed') {
    return `₱${discount.discountValue.toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} off`
  }
  if (discount.discountValue === 100) return 'FREE'
  return `${discount.discountValue}%`
}

export function formatVoucherDiscountDetail(discount: VoucherDiscount): string {
  if (discount.discountType === 'fixed') {
    return `₱${discount.discountValue.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} off`
  }
  return `${discount.discountValue}% off`
}

/** @deprecated Prefer `{ type, value }` object. Numeric arg = percent. */
export function normalizeBookingDiscount(
  discount: BookingDiscount | number | null | undefined,
): BookingDiscount | null {
  if (discount == null) return null
  if (typeof discount === 'number') {
    return discount > 0 ? { discountType: 'percent', discountValue: discount } : null
  }
  return discount.discountValue > 0 ? discount : null
}
