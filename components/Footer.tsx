"use client"

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    const showNavbar = ["/", "/booking", "/guestbooking", "/tourguides", "/complete"];

    if (!showNavbar.includes(pathname)) return null;


    return (
        <footer className="bg-[#F5FFE6] w-full font-poppins">
            <div className="px-2 py-4 sm:px-6 py-10 sm:py-6 lg:py-12 flex flex-col sm:flex-row justify-center md:justify-around gap-8 sm:gap-4 md:gap-0">
                <div className=" w-[80%] sm:w-[20%] flex items-center justify-center self-center">
                    <Image 
                        src="/alegria_logo.png"
                        alt="Alegria logo"
                        width={300}
                        height={300}
                        priority
                        
                    />
                </div>

                <div className="w-full sm:w-[60%] grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-5 lg:gap-12 items-start px-[10%] sm:px-0">
                    <div className="w-full flex flex-col items-start">
                        <div className="w-full sm:w-[80%]">
                        <h3 className="text-2xl sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 align-self-start">Location</h3>
                        <p className="text-base lg:text-[16px] text-gray-700">
                            Alegria Barangay Rd, Alegria, Cebu
                        </p>
                        </div>
                    </div>

                    <div className="w-full flex flex-col items-start">
                        <div className="w-full sm:w-[100%]">
                            <h3 className="text-2xl sm:text-lg lg:text-xl font-bold text-gray-900 mb-3">Contact Us</h3>
                            <p className="text-base lg:text-[16px] text-gray-700">
                                +63968-733-9577 (WhatsApp)
                            </p>
                        </div>
                    </div>

                    <div className="w-full flex flex-col items-start">
                        <div className="w-full">
                        <h3 className="text-2xl sm:text-lg lg:text-xl font-bold text-gray-900 mb-3">Follow Us</h3>
                        <div className="flex w-full justify-between gap-8 sm:gap-4">
                            <a href="#" className="text-gray-700 hover:text-lime-500 transition-colors">
                                <Image
                                    className=""
                                    src="/fb_alegria.png"
                                    alt="FB icon"
                                    width={28}
                                    height={28}
                                    priority
                                />
                            </a>
                            <a href="#" className="text-gray-700 hover:text-lime-500 transition-colors">
                                <Image
                                    className=""
                                    src="/x_alegria.png"
                                    alt="X icon"
                                    width={28}
                                    height={28}
                                    priority
                                />
                            </a>
                            <a href="#" className="text-gray-700 hover:text-lime-500 transition-colors">
                                <Image
                                    className=""
                                    src="/ig_alegria.png"
                                    alt="Instagram icon"
                                    width={28}
                                    height={28}
                                    priority
                                />
                            </a>
                            <a href="#" className="text-gray-700 hover:text-lime-500 transition-colors">
                                <Image
                                    className=""
                                    src="/yt_alegria.png"
                                    alt="Youtube icon"
                                    width={28}
                                    height={28}
                                    priority
                                />
                            </a>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-black py-4">
                <p className="text-white text-center text-sm">
                    © 2025 Alegria Canyoneering
                </p>
            </div>
        </footer>
    );
}