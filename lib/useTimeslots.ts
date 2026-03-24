"use client";

import { useState, useEffect } from "react";
import {
    collection,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { CalendarEvent } from "./calendar-types";

/**
 * useTimeslots
 *
 * Fetches real Firestore timeslots for `activityId` over the next 3 months,
 * then overlays them on top of pre-generated "ghost" slots so every day
 * in the window always shows a clickable AM + PM event — even before any
 * booking has landed on that date.
 *
 * maxSlots is read from `activities/{activityId}.maxSlots` in Firestore —
 * the single source of truth — so it stays correct if the activity capacity
 * is ever updated without requiring any client-side code change.
 *
 * Returns:
 *  - events[]    : merged ghost + real events ready for FullCalendar
 *  - loading     : true until the first onSnapshot fires
 *  - fetchError  : non-null if the Firestore listener errored
 */
export function useTimeslots(activityId: string) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        // Track the live-listener cleanup so we can return it from the effect
        let unsubscribeLive: (() => void) | null = null;

        // ── Date window: today → +3 months ────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeMonthsLater = new Date(today);
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 6);
        threeMonthsLater.setHours(23, 59, 59, 999);

        // ── Step 0: Read maxSlots from the activity document (source of truth) ─
        // One-time read (getDoc) — activity capacity changes very infrequently.
        const activityRef = doc(firestore, "activities", activityId);

        getDoc(activityRef)
            .then((activitySnap) => {
                // Fall back to 30 only if the activity doc is missing the field
                const defaultMax: number =
                    activitySnap.exists()
                        ? (activitySnap.data().maxSlots ?? 30)
                        : 30;

                // ── Step 1: Pre-generate ghost (empty) slots for every day ─────
                // Gives the user clickable slots even on days with zero bookings.
                // Use LOCAL date components — toISOString() is UTC-based and rolls
                // back one day at midnight for UTC+ timezones (e.g. UTC+8).
                const toDateKey = (d: Date): string => {
                    const y = d.getFullYear();
                    const mo = String(d.getMonth() + 1).padStart(2, "0");
                    const da = String(d.getDate()).padStart(2, "0");
                    return `${y}-${mo}-${da}`; // "YYYY-MM-DD" in local time
                };

                const ghostMap: Record<string, CalendarEvent> = {};
                const cursor = new Date(today);

                while (cursor <= threeMonthsLater) {
                    const dateKey = toDateKey(cursor);

                    for (const ampm of ["AM", "PM"] as const) {
                        const isAM = ampm === "AM";
                        const startHour = isAM ? 8 : 13;
                        const endHour = isAM ? 12 : 17;

                        const startIso = new Date(cursor);
                        startIso.setHours(startHour, 0, 0, 0);
                        const endIso = new Date(cursor);
                        endIso.setHours(endHour, 0, 0, 0);

                        const tsId = `${activityId}_${dateKey}_${ampm}`;
                        ghostMap[tsId] = {
                            title: isAM ? "Tour 1" : "Tour 2",
                            start: startIso.toISOString(),
                            end: endIso.toISOString(),
                            extendedProps: {
                                slots: `0/${defaultMax}`,
                                status: "available",
                                slotsAvailable: defaultMax,
                                maxSlots: defaultMax,
                                timeSlotId: tsId,
                                activityId,
                                isGhost: true,
                            },
                        };
                    }

                    cursor.setDate(cursor.getDate() + 1);
                }

                // ── Step 2: Listen to Firestore for real timeslot documents ──────
                // Real docs override the ghost entries by matching tsId key.
                const slotsRef = collection(firestore, "timeslots");
                const q = query(
                    slotsRef,
                    where("activityId", "==", activityId),
                    where("startTime", ">=", Timestamp.fromDate(today)),
                    where("startTime", "<=", Timestamp.fromDate(threeMonthsLater))
                );

                unsubscribeLive = onSnapshot(
                    q,
                    (snapshot) => {
                        console.log(
                            `[useTimeslots] ${snapshot.size} real timeslot(s) received from Firestore for ${activityId}`
                        );

                        // Clone ghost map and overlay real Firestore data
                        const merged: Record<string, CalendarEvent> = { ...ghostMap };

                        snapshot.forEach((docSnap) => {
                            const data = docSnap.data();
                            const tsId: string = docSnap.id; // e.g. "A001_2026-03-15_AM"

                            const startTs: Timestamp = data.startTime;
                            const startDate = startTs.toDate();

                            const isAM = tsId.endsWith("_AM");
                            const startHour = isAM ? 8 : 13;
                            const endHour = isAM ? 12 : 17;

                            const startIso = new Date(startDate);
                            startIso.setHours(startHour, 0, 0, 0);
                            const endIso = new Date(startDate);
                            endIso.setHours(endHour, 0, 0, 0);

                            const slotsAvailable: number = data.slotsAvailable ?? 0;
                            // Prefer maxSlots from the timeslot doc (denormalized copy);
                            // fall back to the value we already read from the activity.
                            const maxSlots: number = data.maxSlots ?? defaultMax;

                            let status: "available" | "limited" | "full" = "available";
                            if (slotsAvailable <= 0) status = "full";
                            else if (slotsAvailable <= Math.ceil(maxSlots * 0.2)) status = "limited";

                            merged[tsId] = {
                                title: isAM ? "Tour 1" : "Tour 2",
                                start: startIso.toISOString(),
                                end: endIso.toISOString(),
                                extendedProps: {
                                    slots: `${maxSlots - slotsAvailable}/${maxSlots}`,
                                    status,
                                    slotsAvailable,
                                    maxSlots,
                                    timeSlotId: tsId,
                                    activityId: data.activityId ?? activityId,
                                    isGhost: false,
                                },
                            };
                        });

                        setEvents(Object.values(merged));
                        setLoading(false);
                    },
                    (err) => {
                        console.error("[useTimeslots] onSnapshot error:", err);
                        setFetchError(err?.message ?? "Unknown error — check browser console");
                        setLoading(false);
                    }
                );
            })
            .catch((err) => {
                console.error("[useTimeslots] Failed to read activity maxSlots:", err);
                setFetchError(err?.message ?? "Could not read activity capacity");
                setLoading(false);
            });

        // Cleanup: unsubscribe the live listener on unmount or activityId change
        return () => {
            unsubscribeLive?.();
        };
    }, [activityId]);

    return { events, loading, fetchError };
}
