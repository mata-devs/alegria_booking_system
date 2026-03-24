import { useState, useEffect } from "react";
import { getPricing, PricingResponse } from "@/lib/booking-service";

/**
 * usePricing
 * 
 * Fetches and manages pricing data based on activity, guests, and optional promo code.
 */
export function usePricing(activityId: string, guestCount: number, promoCode?: string) {
    const [pricing, setPricing] = useState<PricingResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!activityId || guestCount < 1) return;

        let cancelled = false;
        const fetchPricing = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getPricing(activityId, guestCount, promoCode);
                if (!cancelled) setPricing(data);
            } catch (err: unknown) {
                if (!cancelled) {
                    const message = err instanceof Error ? err.message : "Failed to fetch pricing";
                    setError(message);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPricing();
        return () => { cancelled = true; };
    }, [activityId, guestCount, promoCode]);

    return { pricing, loading, error };
}
