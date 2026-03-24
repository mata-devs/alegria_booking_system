"use client"

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    const showNavbar = ["/", "/booking", "/guestbooking"];

    if (!showNavbar.includes(pathname)) return null;


    return (
        <footer className="bg-[#F5FFE6] w-full font-poppins">
            <div className="px-6 py-12 flex flex-col md:flex-row justify-center md:justify-around gap-4 md:gap-0">
                <div className="flex items-center justify-center">
                    <Image 
                        src="/alegria_logo.png"
                        alt="Alegria logo"
                        width={300}
                        height={300}
                        priority
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Location</h3>
                        <p className="text-gray-700">
                            Alegria Barangay Rd,<br />
                            Alegria, Cebu
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h3>
                        <p className="text-gray-700">
                            +63968-733-9577<br />
                            (WhatsApp)
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Follow Us</h3>
                        <div className="flex gap-4">
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

            <div className="bg-black py-4">
                <p className="text-white text-center text-sm">
                    © 2026 Alegria Canyoneering
                </p>
            </div>
        </footer>
    );
}