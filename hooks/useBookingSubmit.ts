import { useState } from "react";
import { createBooking, BookingPayload } from "@/lib/booking-service";
import { toISODate, toTimeSlot } from "@/lib/date-utils";

type BookingGender = "Male" | "Female" | "Prefer not to say";

interface BookingFormData {
    repName: string;
    repEmail: string;
    repPhone: string;
    repAge: string;
    repGender: BookingGender;
    repNationality: string;
}

interface BookingGuest {
    name: string;
    age: string;
    gender: BookingGender;
    nationality: string;
}

interface BookingSubmitContext {
    bookingDate: string;
    bookingTime: string;
    activityId: string;
    formData: BookingFormData;
    guests: BookingGuest[];
    appliedPromo?: string;
    paymentMethod?: string;
}

/**
 * useBookingSubmit
 * 
 * Manages the booking submission state and API logic.
 */
export function useBookingSubmit() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookingId, setBookingId] = useState<string | null>(null);

    const submitBooking = async (context: BookingSubmitContext) => {
        setSubmitting(true);
        setError(null);
        try {
            const tourDate = toISODate(context.bookingDate);
            if (!tourDate) throw new Error("Invalid tour date");

            const payload: BookingPayload = {
                tourDate,
                timeSlot: toTimeSlot(context.bookingTime),
                activityId: context.activityId,
                representative: {
                    fullName: context.formData.repName.trim(),
                    email: context.formData.repEmail.trim(),
                    phoneNumber: context.formData.repPhone.trim(),
                    age: parseInt(context.formData.repAge, 10),
                    gender: context.formData.repGender,
                    nationality: context.formData.repNationality,
                },
                guests: context.guests.map((g) => ({
                    fullName: g.name.trim(),
                    age: parseInt(g.age, 10),
                    gender: g.gender,
                    nationality: g.nationality,
                })),
                promoCode: context.appliedPromo || undefined,
                paymentMethod: context.paymentMethod,
            };

            const data = await createBooking(payload);
            setBookingId(data.bookingId);
            return data.bookingId;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
            setError(message);
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    return { submit: submitBooking, submitting, error, bookingId };
}
