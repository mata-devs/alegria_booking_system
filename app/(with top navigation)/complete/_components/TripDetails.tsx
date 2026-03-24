import { Calendar, Clock, CreditCard, Users } from "lucide-react";

interface TripDetailsProps {
    bookingDate: string;
    bookingTime: string;
    guestTotal?: number;
    paymentMethod?: string;
}

export function TripDetails({
    bookingDate,
    bookingTime,
    guestTotal,
    paymentMethod,
}: TripDetailsProps) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">Trip details</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</p>
                        <p className="font-semibold text-gray-900">{bookingDate}</p>
                    </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</p>
                        <p className="font-semibold text-gray-900">{bookingTime}</p>
                    </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guests</p>
                        <p className="font-semibold text-gray-900">{guestTotal}</p>
                    </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Method</p>
                        <p className="font-semibold text-gray-900">{paymentMethod}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
