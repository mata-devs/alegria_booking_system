interface BookingSummaryProps {
    activityId?: string;
    representativeName?: string;
    representativeEmail?: string;
    representativePhone?: string;
    appliedPromo?: string;
}

export function BookingSummary({
    activityId,
    representativeName,
    representativeEmail,
    representativePhone,
    appliedPromo,
}: BookingSummaryProps) {
    return (
        <aside className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8 lg:max-w-none">
            <h2 className="text-lg font-bold text-gray-900">Booking summary</h2>
            <div className="mt-6 space-y-5 text-sm text-gray-600">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Activity</p>
                    <p className="mt-1 break-all font-semibold text-gray-900">{activityId}</p>
                </div>
                <div className="border-t border-gray-100 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Representative</p>
                    <p className="mt-1 font-semibold text-gray-900">{representativeName || "—"}</p>
                    <p className="mt-1">{representativeEmail || "—"}</p>
                    <p className="mt-0.5">{representativePhone || "—"}</p>
                </div>
                <div className="border-t border-gray-100 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Promo</p>
                    <p className="mt-1 font-semibold text-gray-900">{appliedPromo || "None"}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-emerald-950 text-sm leading-relaxed">
                    Your booking will be <span className="font-semibold">reserved</span> and payment{" "}
                    <span className="font-semibold">pending</span> until an operator verifies your screenshot.
                </div>
            </div>
        </aside>
    );
}
