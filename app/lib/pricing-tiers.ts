export type PricingMode = 'standard' | 'adultChild';

export interface PricingTier {
  minPax: number;
  maxPax: number;
  price?: number; // standard mode: per person
  priceAdult?: number; // adultChild mode: per adult
  priceChild?: number; // adultChild mode: per child
}

export const MAX_TIERS = 10;

/** First tier whose [minPax, maxPax] range contains totalPax. */
export function resolveTier(tiers: PricingTier[], totalPax: number): PricingTier | null {
  return tiers.find((t) => totalPax >= t.minPax && totalPax <= t.maxPax) ?? null;
}

/** Base amount for a resolved tier. Returns 0 when no tier matches. */
export function computeTierBase(
  mode: PricingMode,
  tier: PricingTier | null,
  adults: number,
  children: number,
): number {
  if (!tier) return 0;
  if (mode === 'adultChild') {
    return adults * (tier.priceAdult ?? 0) + children * (tier.priceChild ?? 0);
  }
  return (adults + children) * (tier.price ?? 0);
}

/** Lowest per-person "from" price across tiers — denormalized onto pricePerPerson/pricePerGuest. */
export function lowestFromPrice(mode: PricingMode, tiers: PricingTier[]): number {
  const vals = tiers
    .map((t) => (mode === 'adultChild' ? t.priceAdult : t.price))
    .filter((v): v is number => typeof v === 'number' && v > 0);
  return vals.length ? Math.min(...vals) : 0;
}

/** Split guest ages into adult/child counts. age <= childAgeMax => child. */
export function splitGuestsByAge(
  ages: number[],
  childAgeMax?: number,
): { adults: number; children: number } {
  if (typeof childAgeMax !== 'number' || childAgeMax <= 0) {
    return { adults: ages.length, children: 0 };
  }
  let children = 0;
  for (const age of ages) {
    if (Number.isFinite(age) && age <= childAgeMax) children += 1;
  }
  return { adults: ages.length - children, children };
}

/** A starter tier covering [minPax, maxPax] with empty prices. */
export function makeDefaultTier(minPax: number, maxPax: number): PricingTier {
  return { minPax, maxPax, price: 0, priceAdult: 0, priceChild: 0 };
}

/** Strip a tier list down to the fields relevant for the chosen mode (for Firestore write). */
export function serializeTiers(mode: PricingMode, tiers: PricingTier[]): PricingTier[] {
  return tiers.map((t) =>
    mode === 'adultChild'
      ? { minPax: t.minPax, maxPax: t.maxPax, priceAdult: t.priceAdult ?? 0, priceChild: t.priceChild ?? 0 }
      : { minPax: t.minPax, maxPax: t.maxPax, price: t.price ?? 0 },
  );
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0;
}

/** Group-size bounds implied by the brackets (the brackets are the source of truth). */
export function tiersBounds(tiers: PricingTier[]): { minPax: number; maxPax: number } {
  const mins = tiers.map((t) => t.minPax).filter((n) => Number.isFinite(n) && n > 0);
  const maxs = tiers.map((t) => t.maxPax).filter((n) => Number.isFinite(n) && n > 0);
  return {
    minPax: mins.length ? Math.min(...mins) : 1,
    maxPax: maxs.length ? Math.max(...maxs) : 1,
  };
}

/**
 * Structural validation for the tier builder + write guard.
 * Brackets define the group-size range themselves; they must ascend, be contiguous,
 * and non-overlapping. Returns human-readable errors (empty = valid).
 */
export function validateTiers(mode: PricingMode, tiers: PricingTier[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(tiers) || tiers.length === 0) {
    errors.push('Add at least one bracket.');
    return errors;
  }
  if (tiers.length > MAX_TIERS) {
    errors.push(`No more than ${MAX_TIERS} brackets.`);
  }

  tiers.forEach((tier, i) => {
    const label = `Bracket ${i + 1}`;
    if (!isPositiveInt(tier.minPax) || !isPositiveInt(tier.maxPax)) {
      errors.push(`${label}: min and max must be whole numbers.`);
    } else if (tier.minPax > tier.maxPax) {
      errors.push(`${label}: min must be ≤ max.`);
    }

    if (mode === 'standard') {
      if (!(typeof tier.price === 'number' && tier.price > 0)) {
        errors.push(`${label}: enter a price.`);
      }
    } else {
      if (!(typeof tier.priceAdult === 'number' && tier.priceAdult > 0)) {
        errors.push(`${label}: enter an adult price.`);
      }
      if (!(typeof tier.priceChild === 'number' && tier.priceChild > 0)) {
        errors.push(`${label}: enter a child price.`);
      }
    }

    if (i > 0) {
      const prev = tiers[i - 1];
      if (tier.minPax <= prev.maxPax) {
        errors.push(`${label} overlaps bracket ${i}.`);
      } else if (tier.minPax !== prev.maxPax + 1) {
        errors.push(`Gap before ${label} (expected min ${prev.maxPax + 1}).`);
      }
    }
  });

  return errors;
}
