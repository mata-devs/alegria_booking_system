/** Types for the booking FullCalendar / timeslot UI (separate from `lib/types.ts` user models). */

export type CalendarSlotStatus = "available" | "limited" | "full";

export interface ResolvedCalendarSelection {
    timeSlotId: string;
    activityId: string;
    slotsAvailable: number;
    status: CalendarSlotStatus;
}

export interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    extendedProps: {
        slots: string;
        status: CalendarSlotStatus;
        slotsAvailable: number;
        maxSlots: number;
        timeSlotId: string;
        activityId: string;
        isGhost: boolean; // true = no Firestore doc yet (fully empty slot)
    };
}
