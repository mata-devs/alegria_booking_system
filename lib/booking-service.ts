const API_URL = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL
    ?? "http://localhost:5001/alegria-booking-system/asia-southeast1/booking";

export type PaymentMethod = "Gcash / Maya" | "BDO" | "BPI";
export type BookingGender = "Male" | "Female" | "Prefer not to say";

export interface BookingPayload {
    tourDate: string;
    timeSlot: "AM" | "PM";
    activityId: string;
    tourOperatorUid?: string;
    representative: {
        fullName: string;
        email: string;
        phoneNumber: string;
        age: number;
        gender: BookingGender;
        nationality: string;
    };
    guests: {
        fullName: string;
        age: number;
        gender: BookingGender;
        nationality: string;
    }[];
    promoCode?: string;
    specialRequests?: string;
    paymentMethod: PaymentMethod;
    receiptDataUrl: string;
    idempotencyKey?: string;
}

const createIdempotencyKey = () => crypto.randomUUID();

/**
 * Creates a new booking via POST /bookings — the single client-facing endpoint.
 * Uploads the receipt and creates a pending payment record atomically.
 */
export const createBooking = async (payload: BookingPayload) => {
    const idempotencyKey = payload.idempotencyKey || createIdempotencyKey();
    const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create booking");
    return data;
};
