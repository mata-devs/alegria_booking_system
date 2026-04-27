const API_URL =
    process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL ||
    "http://localhost:5001/alegria-booking-system/asia-southeast1/api";

export type PaymentMethod = "Gcash / Maya" | "BDO" | "BPI";
export type BookingGender = "Male" | "Female" | "Prefer not to say";

export interface BookingPayload {
    tourDate: string;
    // timeSlot kept for backend compatibility — whole-day bookings use "AM" by default
    timeSlot: "AM" | "PM";
    activityId: string;
    sourceType?: "activity" | "tourPackage";
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

export const confirmBookingPayment = async (bookingId: string) => {
    const res = await fetch(`${API_URL}/bookings/${bookingId}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to confirm booking");
    return data as { bookingId: string };
};

export const createBooking = async (payload: BookingPayload) => {
    const idempotencyKey = payload.idempotencyKey ?? crypto.randomUUID();
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
    return data as { bookingId: string };
};
