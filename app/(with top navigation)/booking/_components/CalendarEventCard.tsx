"use client";

import React from "react";
import { Users } from "lucide-react";

interface CalendarEventCardProps {
    title: string;
    slots: string;
    start: Date | null;
    end: Date | null;
    /** true = ghost placeholder (no Firestore doc); false = real Firestore event */
    isGhost: boolean;
    /** Booked seats so far (used for fill-% colour bands on ghost slots) */
    slotsBooked: number;
    /** Total capacity for this timeslot */
    maxSlots: number;
    /** Whether this card matches the booking currently selected by the user. */
    isSelected: boolean;
}

/**
 * CalendarEventCard
 *
 * The visual card rendered inside each FullCalendar event block.
 * Handles color coding (green / orange / red) and the slots display.
 * Extracted so it can be tested and styled independently from the
 * Firestore / calendar wiring.
 */
/**
 * Maps fill percentage → colour hex.
 *
 *   0–49%  → Green  #8BC34A  (available)
 *  50–99%  → Orange #F97316  (filling up)
 *  100%    → Red    #C73622  (fully booked)
 */
function fillColor(booked: number, max: number): string {
    if (max <= 0) return "#8BC34A";
    const pct = (booked / max) * 100;
    if (pct >= 100) return "#C73622";
    if (pct >= 50) return "#F97316";
    return "#8BC34A";
}

export function CalendarEventCard({
    title,
    slots,
    start,
    end,
    isGhost,
    slotsBooked,
    maxSlots,
    isSelected,
}: CalendarEventCardProps) {
    /**
     * Colour logic (applies to BOTH ghost and real events):
     * The card colour reflects fill percentage so operators can read
     * occupancy at a glance regardless of whether the timeslot doc exists.
     *
     * Visual distinction between ghost vs real is handled by border style:
     *  • Ghost slots  → dashed border (placeholder, no real bookings yet)
     *  • Real events  → solid border  (live Firestore data)
     */
    const eventColor = fillColor(slotsBooked, maxSlots);

    const formatTime = (date: Date | null): string => {
        if (!date) return "";
        let h = date.getHours();
        const ap = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h} ${ap}`;
    };

    const timeStr = `${formatTime(start)} - ${formatTime(end)}`;

    const textStyle: React.CSSProperties = {
        color: eventColor,
    };

    /**
     * Tweak these values to control the Spinning Gradient Border:
     * - Speed: Set the 'animation' duration in the className below (e.g., 'animate-[spin-border_3s_linear_infinite]')
     * - Colors: Modify the 'conic-gradient' stops in the borderStyle object.
     *   Currently, it transitions from transparent -> eventColor (dynamic fill status) -> green -> transparent.
     */
    const borderStyle: React.CSSProperties = isSelected
        ? {
              // 1) Inner background (padding-box) is the selected background color
              // 2) Outer background (border-box) is the spinning conic gradient
              background: `
                  linear-gradient(#F2FBFC, #F2FBFC) padding-box,
                  conic-gradient(
                      from var(--border-angle),
                      transparent 25%,
                      ${eventColor} 60%,
                      #74C00F 85%,
                      transparent 100%
                  ) border-box
              `,
              borderColor: "transparent", // Ensures the border-box background displays through the border region
              borderWidth: "2px",
              borderStyle: "solid",
          }
        : {
              borderColor: eventColor,
              // Ghost slots use a dashed border so they're visually distinct from
              // real Firestore-backed events which use a solid border.
              borderStyle: isGhost ? "dashed" : "solid",
              borderWidth: "2px",
              background: "white",
          };

    return (
        <div
            style={borderStyle}
            // Animate spin-border using the custom keyframes added to globals.css
            className={`flex flex-col h-full rounded-[6px] p-2 md:p-3 overflow-hidden font-poppins transition-all ${isSelected
                ? "shadow-md ring-2 ring-[#74C00F]/30 animate-[spin-border_3s_linear_infinite]"
                : "shadow-sm hover:shadow-md"
                }`}
        >
            {/* Tour label + time range */}
            <div className="flex flex-col items-start leading-tight" style={textStyle}>
                <span className="font-bold text-[13px] md:text-[15px]">{title}</span>
                <span className="text-[10px] md:text-xs font-medium uppercase mt-1 opacity-80">
                    {timeStr}
                </span>
            </div>

            {/* Slots counter */}
            <div className="mt-auto flex flex-col items-center justify-center" style={textStyle}>
                <span className="text-[11px] font-bold">Slots</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-sm md:text-base">{slots}</span>
                    <Users size={16} />
                </div>
                {/*{status === "limited" && (
                    <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5 opacity-70">
                        Limited
                    </span>
                )*/}
            </div>
        </div>
    );
}
