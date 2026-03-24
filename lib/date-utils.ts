/**
 * Converts a display date string (e.g., "January 18, 2026") to ISO format "YYYY-MM-DD".
 */
const BOOKING_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const BOOKING_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
});

const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime());

const parseDateValue = (value: string): Date | null => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
};

const parseTimeValue = (value: string): Date | null => {
    const twelveHourMatch = value.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);

    if (twelveHourMatch) {
        const [, rawHour, rawMinute, rawPeriod] = twelveHourMatch;
        const date = new Date();
        let hours = Number.parseInt(rawHour, 10) % 12;

        if (rawPeriod.toUpperCase() === "PM") {
            hours += 12;
        }

        date.setHours(hours, Number.parseInt(rawMinute, 10), 0, 0);
        return date;
    }

    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
};

export const toISODate = (display: string): string => {
    const d = new Date(display);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
};

/**
 * Maps a display time string (e.g., "8:00 AM") to "AM" or "PM".
 */
export const toTimeSlot = (display: string): "AM" | "PM" => {
    return display.trim().toUpperCase().includes("PM") ? "PM" : "AM";
};

/**
 * Formats a booking date in the short display style used by the booking flow.
 */
export const formatBookingDisplayDate = (value: Date | string): string => {
    const parsed = typeof value === "string" ? parseDateValue(value) : value;
    if (!parsed || !isValidDate(parsed)) return typeof value === "string" ? value : "";
    return BOOKING_DATE_FORMATTER.format(parsed);
};

/**
 * Formats a booking time in the display style used by the booking flow.
 */
export const formatBookingDisplayTime = (value: Date | string): string => {
    const parsed = typeof value === "string" ? parseTimeValue(value) : value;
    if (!parsed || !isValidDate(parsed)) return typeof value === "string" ? value : "";
    return BOOKING_TIME_FORMATTER.format(parsed);
};

/**
 * Normalizes an incoming booking date query param to the booking UI display format.
 */
export const normalizeBookingDateParam = (value: string | null): string => {
    if (!value) return "";
    return formatBookingDisplayDate(value);
};

/**
 * Normalizes an incoming booking time query param to the booking UI display format.
 */
export const normalizeBookingTimeParam = (value: string | null): string => {
    if (!value) return "";
    return formatBookingDisplayTime(value);
};

/**
 * Formats a date string to a more readable format for the UI.
 */
export const formatDisplayDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
