"use client";

import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { BookingCalendar } from "./_components/BookingCalendar";
import type { CalendarSlotStatus, ResolvedCalendarSelection } from "./_components/types";
import { BookingSidebar } from "./_components/BookingSidebar";
import { TourInfoSection } from "./_components/TourInfoSection";
import BookingGallery from "./BookingGallery";
import ExperiencesDescription from "./ExperiencesDescription";
import Include from "./Include";
import Reviews from "./Reviews";
import ReviewForm from "./ReviewForm";
import { normalizeBookingDateParam, normalizeBookingTimeParam } from "@/lib/date-utils";

export default function BookingPageClient() {
    const searchParams = useSearchParams();
    const initialBookingDate = normalizeBookingDateParam(searchParams.get("date"));
    const initialBookingTime = normalizeBookingTimeParam(searchParams.get("time"));
    const initialTimeSlotId = searchParams.get("slotId") ?? "";
    const initialActivityId = searchParams.get("activityId") ?? "A001";
    const rawGuests = searchParams.get("guests");
    const parsedGuests = rawGuests ? Number.parseInt(rawGuests, 10) : 1;
    const initialGuestCount = Number.isNaN(parsedGuests) || parsedGuests < 1 ? 1 : parsedGuests;

    const [selectedBookingDate, setSelectedBookingDate] = useState("");
    const [selectedBookingTime, setSelectedBookingTime] = useState("");
    const [selectedTimeSlotId, setSelectedTimeSlotId] = useState("");
    const [selectedActivityId, setSelectedActivityId] = useState("");
    const [selectedSlotsAvailable, setSelectedSlotsAvailable] = useState<number | null>(null);
    const [selectedSlotStatus, setSelectedSlotStatus] = useState<CalendarSlotStatus | null>(null);
    const bookingDate = selectedBookingDate || initialBookingDate;
    const bookingTime = selectedBookingTime || initialBookingTime;
    const timeSlotId = selectedTimeSlotId || initialTimeSlotId;
    const activityId = selectedActivityId || initialActivityId;

    const calendarRef = useRef<HTMLDivElement>(null);
    const scrollToCalendar = useCallback(() => {
        calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    const handleCalendarEventClick = useCallback(
        (
            dateStr: string,
            timeStr: string,
            slotId: string,
            actId: string,
            slotsAvailable: number
        ) => {
            setSelectedBookingDate(dateStr);
            setSelectedBookingTime(timeStr);
            setSelectedTimeSlotId(slotId);
            setSelectedActivityId(actId);
            setSelectedSlotsAvailable(slotsAvailable);
            setSelectedSlotStatus(slotsAvailable <= 0 ? "full" : "available");
        },
        []
    );

    const handleResolvedSelection = useCallback((selection: ResolvedCalendarSelection | null) => {
        if (!selection) {
            setSelectedTimeSlotId("");
            setSelectedActivityId("");
            setSelectedSlotsAvailable(null);
            setSelectedSlotStatus(null);
            return;
        }

        setSelectedTimeSlotId(selection.timeSlotId);
        setSelectedActivityId(selection.activityId);
        setSelectedSlotsAvailable(selection.slotsAvailable);
        setSelectedSlotStatus(selection.status);
    }, []);

    return (
        <div className="flex flex-col items-center w-full max-w-full pl-[7%] pr-[7%] justify-start bg-white min-h-screen font-poppins">
            <div className="flex flex-row justify-center gap-[3%] pt-[1%] pb-[2%] w-full h-[100vh] mb-[1%]">
                <BookingGallery />
            </div>

            {/* Left column ~65% + right sidebar ~36%, same proportions as reference booking page */}
            <div className="w-full flex flex-col lg:flex-row lg:items-start gap-y-8 lg:gap-x-8 pt-[3%]">
                <div className="min-w-0 w-full lg:w-[65%] bg-pink-50 flex flex-col gap-6 md:gap-8 mb-[5%]">
                    <TourInfoSection />

                    <div
                        ref={calendarRef}
                        className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100"
                    >
                        <BookingCalendar
                            activityId={activityId}
                            selectedBookingDate={bookingDate}
                            selectedBookingTime={bookingTime}
                            onEventClick={handleCalendarEventClick}
                            onSelectionResolved={handleResolvedSelection}
                        />
                    </div>

                    <ExperiencesDescription />
                    <Include />

                    <Reviews />
                    <ReviewForm />
                </div>

                <div className="min-w-0 w-full lg:w-[36%] flex justify-center lg:sticky lg:top-28 lg:z-20 lg:h-fit lg:self-start">
                    <BookingSidebar
                        bookingDate={bookingDate}
                        bookingTime={bookingTime}
                        selectedTimeSlotId={timeSlotId}
                        selectedActivityId={activityId}
                        slotsAvailable={selectedSlotsAvailable}
                        selectedSlotStatus={selectedSlotStatus}
                        initialGuestCount={initialGuestCount}
                        onScrollToCalendar={scrollToCalendar}
                    />
                </div>
            </div>
        </div>
    );
}
