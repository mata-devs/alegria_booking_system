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
