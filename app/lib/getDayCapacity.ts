import { doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

type CapacityMap = Record<string, number | null>;

function normalizeDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return date;
}

function toTimeSlotId(sourceId: string, date: string): string {
  return `${sourceId}_${date}`;
}

/**
 * Returns `slotsAvailable` per source id for a single day.
 * If a timeslot document does not exist yet, value is `null` and callers should
 * treat it as "no bookings yet" (fallback to source max capacity).
 */
export async function getDayCapacity(sourceIds: string[], date: string): Promise<CapacityMap> {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate || sourceIds.length === 0) return {};

  const uniqueIds = Array.from(new Set(sourceIds.filter(Boolean)));
  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const slotSnap = await getDoc(doc(firebaseDb, 'timeslots', toTimeSlotId(id, normalizedDate)));
      if (!slotSnap.exists()) return [id, null] as const;
      const data = slotSnap.data();
      const slotsAvailable = typeof data.slotsAvailable === 'number' ? data.slotsAvailable : null;
      return [id, slotsAvailable] as const;
    }),
  );

  return Object.fromEntries(results);
}
