"use client";

import { useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Loader2 } from "lucide-react";
import { useTimeslots } from "@/lib/useTimeslots";
import { CalendarEventCard } from "./CalendarEventCard";
import type { ResolvedCalendarSelection } from "./types";
import { formatBookingDisplayDate, formatBookingDisplayTime } from "@/lib/date-utils";

// ─── Props ────────────────────────────────────────────────────────────────────
interface BookingCalendarProps {
    /** ID of the activity whose timeslots should be displayed (e.g. "A001") */
    activityId: string;
    /** Currently selected booking date shown in the sidebar/query string. */
    selectedBookingDate?: string;
    /** Currently selected booking time shown in the sidebar/query string. */
    selectedBookingTime?: string;
    /** Called when the user clicks a non-full event. Provides date string,
     *  human-readable time string, the timeslot doc ID, the activity ID,
     *  and how many slots are still available on that timeslot. */
    onEventClick?: (
        dateStr: string,
        timeStr: string,
        timeSlotId: string,
        activityId: string,
        slotsAvailable: number
    ) => void;
    /** Resolves the currently selected date/time to its live slot metadata, including full slots. */
    onSelectionResolved?: (selection: ResolvedCalendarSelection | null) => void;
}

// ─── Day header labels ─────────────────────────────────────────────────────────
const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ─── FullCalendar scoped CSS ───────────────────────────────────────────────────
const CALENDAR_STYLES = `
    .calendar-container .fc { background: white; }
    .calendar-container .fc-header-toolbar { margin-bottom: 1.5rem !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
    .calendar-container .fc-toolbar-chunk { display: flex; align-items: center; }
    .calendar-container .fc-toolbar-chunk:nth-child(1) { flex: 0 0 50px; justify-content: flex-start; }
    .calendar-container .fc-toolbar-chunk:nth-child(2) { flex: 1; justify-content: center; overflow: visible; }
    .calendar-container .fc-toolbar-chunk:nth-child(3) { flex: 0 0 50px; justify-content: flex-end; }
    .calendar-container .fc-toolbar-title { font-size: 24px !important; font-weight: 700 !important; color: #333 !important; white-space: nowrap !important; text-align: center !important; }
    .calendar-container .fc-button-primary { background-color: transparent !important; border: none !important; color: #111 !important; box-shadow: none !important; padding: 0 !important; }
    .calendar-container .fc-button-primary:hover { color: #555 !important; }
    .calendar-container .fc-button-primary:focus { box-shadow: none !important; }
    .calendar-container .fc-icon { font-size: 28px !important; font-weight: 900 !important; }
    .calendar-container .fc-col-header-cell.fc-day { background-color: #8CC63F; border: none !important; padding: 4px 0; }
    .calendar-container .fc-theme-standard th { border-left: none !important; border-right: none !important; }
    .calendar-container .fc-timegrid-axis { border: none !important; }
    .calendar-container .fc-scrollgrid { border: none !important; }
    .calendar-container .fc-theme-standard td { border-color: #E5E7EB !important; }
    .calendar-container .fc-v-event { background: transparent !important; border: none !important; box-shadow: none !important; padding: 2px 4px !important; cursor: pointer !important; transition: transform 0.1s ease; }
    .calendar-container .fc-v-event:hover { transform: scale(0.98); }
    .calendar-container .fc-timegrid-slot-label-cushion { font-size: 11px; font-weight: 500; color: #4B5563; text-transform: uppercase; }
`;

// ─── Loading state ─────────────────────────────────────────────────────────────
function CalendarLoading() {
    return (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 className="animate-spin w-6 h-6 text-[#74C00F]" />
            <span className="font-poppins text-sm">Loading... Please Wait</span>
        </div>
    );
}

// ─── Error state ───────────────────────────────────────────────────────────────
function CalendarError({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 text-xl font-bold">!</span>
            </div>
            <p className="font-bold text-black">Could not load availability</p>
            <p className="text-xs text-gray-500 max-w-sm bg-gray-100 p-3 rounded-xl">
                {message}
            </p>
            {/*should edit this one for production, change to false*/}
            <p className="text-xs text-gray-400">
                Make sure the Firebase emulator is running and{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_USE_EMULATOR=true</code>{" "}
                is set in your <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code>.
            </p>
        </div>
    );
}

// ─── BookingCalendar ───────────────────────────────────────────────────────────
/**
 * BookingCalendar
 *
 * Renders a week-view FullCalendar populated with tour availability.
 * - Ghost slots are shown for every day in the next 3 months (always clickable)
 * - Real Firestore timeslot docs override ghosts with live slotsAvailable data
 * - Clicking a non-full event fires onEventClick with date, time, slotId, activityId
 */
export function BookingCalendar({
    activityId,
    selectedBookingDate,
    selectedBookingTime,
    onEventClick,
    onSelectionResolved,
}: BookingCalendarProps) {
    const { events, loading, fetchError } = useTimeslots(activityId);
    const today = new Date();
    const parsedSelectedDate = selectedBookingDate ? new Date(selectedBookingDate) : null;
    const initialCalendarDate = parsedSelectedDate && !Number.isNaN(parsedSelectedDate.getTime())
        ? parsedSelectedDate
        : today;

    useEffect(() => {
        if (!onSelectionResolved) {
            return;
        }

        if (!selectedBookingDate || !selectedBookingTime || events.length === 0) {
            onSelectionResolved(null);
            return;
        }

        const matchingEvent = events.find((event) => (
            formatBookingDisplayDate(event.start) === selectedBookingDate
            && formatBookingDisplayTime(event.start) === selectedBookingTime
        ));

        if (!matchingEvent) {
            onSelectionResolved(null);
            return;
        }

        const { timeSlotId, activityId: slotActivityId, slotsAvailable, status } = matchingEvent.extendedProps;
        onSelectionResolved({
            timeSlotId,
            activityId: slotActivityId,
            slotsAvailable,
            status,
        });
    }, [events, onSelectionResolved, selectedBookingDate, selectedBookingTime]);

    if (loading) return <CalendarLoading />;
    if (fetchError) return <CalendarError message={fetchError} />;

    return (
        <div className="w-full calendar-container font-poppins relative">
            <FullCalendar
                plugins={[timeGridPlugin]}
                initialView="timeGridWeek"
                initialDate={initialCalendarDate}
                firstDay={0}
                events={events}
                slotMinTime="07:00:00"
                slotMaxTime="18:00:00"
                allDaySlot={false}
                height="auto"
                handleWindowResize={true}
                headerToolbar={{
                    left: "prev",
                    center: "title",
                    right: "next",
                }}
                titleFormat={{
                    month: "long",   // "March" instead of "Mar"
                    year: "numeric",
                    day: "numeric",
                }}
                eventClick={(arg) => {
                    const { status, timeSlotId, activityId: slotActivityId } =
                        arg.event.extendedProps;
                    const slotAvail: number = (arg.event.extendedProps.slotsAvailable as number) ?? 0;

                    if (status !== "full" && arg.event.start && onEventClick) {
                        const dateObj = arg.event.start;
                        const dateStr = formatBookingDisplayDate(dateObj);
                        const timeStr = formatBookingDisplayTime(dateObj);

                        onEventClick(dateStr, timeStr, timeSlotId, slotActivityId, slotAvail);
                    }
                }}
                dayHeaderContent={(arg) => (
                    <div className="flex flex-col items-center justify-center text-white py-1 md:py-2">
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                            {DAY_LABELS[arg.date.getDay()]}
                        </span>
                        <span className="text-xl md:text-2xl font-bold">
                            {arg.date.getDate()}
                        </span>
                    </div>
                )}
                eventContent={(arg) => {
                    const { slots, isGhost, slotsAvailable, maxSlots } =
                        arg.event.extendedProps;
                    const isSelected = Boolean(
                        selectedBookingDate
                        && selectedBookingTime
                        && arg.event.start
                        && formatBookingDisplayDate(arg.event.start) === selectedBookingDate
                        && formatBookingDisplayTime(arg.event.start) === selectedBookingTime
                    );
                    // slotsBooked = capacity − available (ghost slots start at 0 booked)
                    const slotsBooked = Math.max(0, (maxSlots ?? 0) - (slotsAvailable ?? maxSlots ?? 0));
                    return (
                        <CalendarEventCard
                            title={arg.event.title}
                            slots={slots}
                            start={arg.event.start}
                            end={arg.event.end}
                            isGhost={isGhost}
                            slotsBooked={slotsBooked}
                            maxSlots={maxSlots ?? 0}
                            isSelected={isSelected}
                        />
                    );
                }}
            />

            {/* Scoped styles for FullCalendar theme overrides */}
            <style dangerouslySetInnerHTML={{ __html: CALENDAR_STYLES }} />
        </div>
    );
}
