interface PaymentInstructionsProps {
    paymentMethod: string;
    paymentImageUrl: string | null;
    paymentNotes: string | null;
}

export function PaymentInstructions({
    paymentMethod,
    paymentImageUrl,
    paymentNotes,
}: PaymentInstructionsProps) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">Payment instructions</h2>
            <p className="mt-2 text-sm text-gray-600">Use the details shown — send the exact amount when prompted.</p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-[#F9FAFB]">
                {paymentImageUrl ? (
                    <img
                        src={paymentImageUrl}
                        alt={`${paymentMethod} payment instructions`}
                        className="w-full object-cover"
                    />
                ) : (
                    <div className="p-8 text-center text-sm text-gray-500">
                        No payment instruction image is configured for this method yet.
                    </div>
                )}
            </div>
            {paymentNotes && (
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{paymentNotes}</p>
            )}
        </section>
    );
}
