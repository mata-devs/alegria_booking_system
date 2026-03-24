import { Suspense } from "react";
import BookingPageClient from "./BookingPageClient";

export const dynamic = "force-dynamic";

export default function BookingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center font-poppins text-gray-500 bg-[#F9FAFB]">
                    Loading booking…
                </div>
            }
        >
            <BookingPageClient />
        </Suspense>
    );
}
