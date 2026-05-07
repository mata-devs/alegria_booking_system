import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

export interface ApprovedReview {
  id: string;
  reviewerName: string;
  reviewerCountry: string;
  rating: number;
  text: string;
  createdAt: Date | null;
}

/** Guest catalog review with item label (from Firestore `location` = booked activity/package name). */
export interface CatalogReview extends ApprovedReview {
  itemTitle: string;
  sourceType: 'activity' | 'tourPackage';
}

export async function getApprovedReviewsForItem(
  itemId: string,
  type: 'activity' | 'tourPackage',
): Promise<ApprovedReview[]> {
  const field = type === 'activity' ? 'activityId' : 'tourPackageId';
  const q = query(
    collection(firebaseDb, 'reviews'),
    where(field, '==', itemId),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      reviewerName: data.reviewerName ?? 'Anonymous',
      reviewerCountry: data.reviewerCountry ?? '',
      rating: data.rating ?? 0,
      text: data.text ?? '',
      createdAt: data.createdAt?.toDate?.() ?? null,
    };
  });
}

/**
 * All published (approved) reviews across activities and tour packages, newest first.
 * Uses a single `status` query and sorts client-side to avoid extra composite indexes.
 */
export async function getAllApprovedReviewsForCatalog(): Promise<CatalogReview[]> {
  const q = query(collection(firebaseDb, 'reviews'), where('status', '==', 'approved'));
  const snap = await getDocs(q);
  const rows: CatalogReview[] = snap.docs.map((d) => {
    const data = d.data();
    const sourceType = data.sourceType === 'tourPackage' ? 'tourPackage' : 'activity';
    const loc = String(data.location ?? '').trim();
    const itemTitle =
      loc ||
      (sourceType === 'tourPackage' ? 'Tour package' : 'Activity');
    return {
      id: d.id,
      reviewerName: data.reviewerName ?? 'Anonymous',
      reviewerCountry: data.reviewerCountry ?? '',
      rating: data.rating ?? 0,
      text: data.text ?? '',
      createdAt: data.createdAt?.toDate?.() ?? null,
      itemTitle,
      sourceType,
    };
  });
  rows.sort((a, b) => {
    const ta = a.createdAt?.getTime() ?? 0;
    const tb = b.createdAt?.getTime() ?? 0;
    return tb - ta;
  });
  return rows;
}
