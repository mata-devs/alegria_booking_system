"use client";

import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { BookingCalendar } from "./_components/BookingCalendar";
import type { CalendarSlotStatus, ResolvedCalendarSelection } from "./_components/types";
import { BookingSidebar } from "@/app/(client)/_components/booking/BookingSidebar";
import { TourInfoSection } from "./_components/TourInfoSection";
import Navbar from "@/app/(client)/_components/layout/Navbar";
import Footer from "@/app/(client)/_components/layout/Footer";
import { ReviewsSection } from "@/app/(client)/booking/_components/ReviewsSection";
import { ExperienceSection } from "@/app/(client)/booking/_components/ExperienceSection";
import { normalizeBookingDateParam, normalizeBookingTimeParam } from "@/lib/date-utils";

export default function BookingPageV3() {
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

    // Ref for the calendar section — used by the sidebar to scroll into view
    const calendarRef = useRef<HTMLDivElement>(null);
    const scrollToCalendar = useCallback(() => {
        calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    const handleCalendarEventClick = useCallback((
        dateStr: string,
        timeStr: string,
        timeSlotId: string,
        actId: string,
        slotsAvailable: number
    ) => {
        setSelectedBookingDate(dateStr);
        setSelectedBookingTime(timeStr);
        setSelectedTimeSlotId(timeSlotId);
        setSelectedActivityId(actId);
        setSelectedSlotsAvailable(slotsAvailable);
        setSelectedSlotStatus(slotsAvailable <= 0 ? "full" : "available");
    }, []);

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
        <div className="min-h-screen bg-[#F9FAFB] font-poppins pb-24">
            {/* Navbar */}
            <Navbar />

            <main className="max-w-7xl mx-auto mt-8 md:mt-10 px-4 xl:px-8">
                {/* Hero Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[450px] mb-8 md:mb-12">
                    <div className="md:col-span-2 relative h-[300px] md:h-full rounded-3xl overflow-hidden group">
                        <Image src="/alegria.png" alt="Alegria Main" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/10" />
                        <button className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm text-black font-semibold px-5 py-2.5 rounded-full shadow-lg hover:bg-white transition text-sm">
                            Show all photos
                        </button>
                    </div>
                    <div className="hidden md:flex flex-col gap-4 h-full">
                        <div className="relative flex-1 rounded-3xl overflow-hidden group">
                            <Image src="/alegria.png" alt="Gallery 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="relative flex-1 rounded-3xl overflow-hidden group">
                            <Image src="/alegria.png" alt="Gallery 2" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="relative flex-1 rounded-3xl overflow-hidden group">
                            <Image src="/alegria.png" alt="Gallery 3" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Left Column (Main Content) */}
                    <div className="flex-1 w-full flex flex-col space-y-12">

                        {/* Tour Info Section */}
                        <TourInfoSection />

                        {/* ── Availability Scheduler ─────────────────────────────────────────── */}
                        {/* All Firestore + ghost-slot logic lives in _components/BookingCalendar */}
                        <div ref={calendarRef} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
                            <BookingCalendar
                                activityId={activityId}
                                selectedBookingDate={bookingDate}
                                selectedBookingTime={bookingTime}
                                onEventClick={handleCalendarEventClick}
                                onSelectionResolved={handleResolvedSelection}
                            />
                        </div>

                        {/* Experience Section */}
                        <ExperienceSection />

                        <hr className="border-gray-200" />

                        {/* Reviews Section */}
                        <ReviewsSection />
                    </div>

                    {/* Right Column (Sticky Booking Sidebar) */}
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
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
