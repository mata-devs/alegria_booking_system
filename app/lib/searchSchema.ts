import { z } from 'zod';

export const searchSchema = z.object({
  location: z.string().trim().max(80).regex(/^[\p{L}\p{N}\s,'\-]*$/u).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  travelers: z.string().regex(/^\d{1,2}$/).optional(),
  priceMin: z.coerce.number().min(0).max(1_000_000).optional(),
  priceMax: z.coerce.number().min(0).max(1_000_000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['recommended', 'priceAsc', 'priceDesc', 'ratingDesc', 'newest']).optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

export type GuestListingSearchFields = {
  location: string;
  date: string;
  travelers: string;
};

/** `location`, `date`, `travelers` for guest activity / tour-package listing URLs. */
export function parseGuestListingSearchParams(
  searchParams: { get: (name: string) => string | null },
): GuestListingSearchFields {
  const result = searchSchema.safeParse({
    location: searchParams.get('location') ?? undefined,
    date: searchParams.get('date') ?? undefined,
    travelers: searchParams.get('travelers') ?? undefined,
  });
  if (!result.success) {
    console.warn('Invalid search params:', result.error.flatten());
    return { location: '', date: '', travelers: '' };
  }
  return {
    location: result.data.location ?? '',
    date: result.data.date ?? '',
    travelers: result.data.travelers ?? '',
  };
}
