import { z } from "zod";

export type PricingMode = "standard" | "adultChild";

export interface PricingTier {
  minPax: number;
  maxPax: number;
  price?: number;
  priceAdult?: number;
  priceChild?: number;
}

const tierSchema = z.object({
  minPax: z.number().int().positive(),
  maxPax: z.number().int().positive(),
  price: z.number().positive().optional(),
  priceAdult: z.number().positive().optional(),
  priceChild: z.number().positive().optional(),
});

const tiersSchema = z.array(tierSchema).min(1).max(10);

/** Parse tiers from a listing doc; returns [] when absent/malformed (caller falls back to flat price). */
export function parseTiers(raw: unknown): PricingTier[] {
  const result = tiersSchema.safeParse(raw);
  return result.success ? result.data : [];
}

export function parsePricingMode(raw: unknown): PricingMode {
  return raw === "adultChild" ? "adultChild" : "standard";
}

export function resolveTier(tiers: PricingTier[], totalPax: number): PricingTier | null {
  return tiers.find((t) => totalPax >= t.minPax && totalPax <= t.maxPax) ?? null;
}

export function computeTierBase(
  mode: PricingMode,
  tier: PricingTier | null,
  adults: number,
  children: number,
): number {
  if (!tier) return 0;
  if (mode === "adultChild") {
    return adults * (tier.priceAdult ?? 0) + children * (tier.priceChild ?? 0);
  }
  return (adults + children) * (tier.price ?? 0);
}

/** age <= childAgeMax => child. Derived server-side from guest ages; client counts are not trusted. */
export function splitGuestsByAge(
  ages: number[],
  childAgeMax?: number,
): { adults: number; children: number } {
  if (typeof childAgeMax !== "number" || childAgeMax <= 0) {
    return { adults: ages.length, children: 0 };
  }
  let children = 0;
  for (const age of ages) {
    if (Number.isFinite(age) && age <= childAgeMax) children += 1;
  }
  return { adults: ages.length - children, children };
}
