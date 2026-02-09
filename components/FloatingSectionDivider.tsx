import Image from "next/image";
import Link from "next/link";

export default function FloatingSectionDivider() {
    return (
        <div className="relative -mt-12 mb-20 px-4 md:px-8 lg:px-16">
            <div className="max-w-[99%] mx-auto bg-white rounded-full shadow-lg p-6 md:py-6 md:px-16">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div
                        className=" w-[50%] flex justify-center"
                    >
                        <div
                            className="flex justify-between w-[75%]"
                        >
                            {/* Date Section */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                                    <Image
                                        className=""
                                        src="/calendar.png"
                                        alt="calendar icon"
                                        width={60}
                                        height={60}
                                        priority
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Jan 1 - Jan 6</p>
                                    <p className="text-sm text-gray-500">Date</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-10 bg-gray-300"></div>

                            {/* Guests Section */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                                    <Image
                                        className=""
                                        src="/guests.png"
                                        alt="guests icon"
                                        width={60}
                                        height={60}
                                        priority
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">4 Guests</p>
                                    <p className="text-sm text-gray-500">Guests</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Book Button */}
                    <Link href="/booking">
                    <button className="bg-[#178893] hover:bg-teal-700 text-white font-semibold px-16 py-3 rounded-full transition-colors">
                        Book
                    </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}