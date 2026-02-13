"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar(){
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-sm">
            <div className="flex items-center justify-between p-4 max-w-[95%] mx-auto">
                {/* Logo */}
                <div className="shrink-0">
                    <Image
                        src="/alegria_logo.png"
                        alt="Alegria logo"
                        width={140}
                        height={140}
                        className="w-28 sm:w-36 lg:w-44"
                        priority
                    />
                </div>

                <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-black font-poppins">
                    <Link href="/" className="hover:text-[#45A80A] transition-colors">
                        Home
                    </Link>
                    <Link href="/" className="hover:text-[#45A80A] transition-colors">
                        Tour Packages
                    </Link>
                    <Link href="/" className="hover:text-[#45A80A] transition-colors">
                        More Tours
                    </Link>
                    <Link href="/">
                        <button className="bg-[#45A80A] hover:bg-[#3a8c08] rounded-lg px-6 xl:px-10 py-2.5 xl:py-3 text-white transition-colors">
                            Book Now
                        </button>
                    </Link>
                </div>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden p-2 text-black hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {isMenuOpen ? (
                            <path d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {isMenuOpen && (
                <div className="lg:hidden border-t border-gray-200">
                    <div className="flex flex-col p-4 space-y-4 text-black font-poppins">
                        <Link 
                            href="/" 
                            className="hover:text-[#45A80A] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link 
                            href="/" 
                            className="hover:text-[#45A80A] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Tour Packages
                        </Link>
                        <Link 
                            href="/" 
                            className="hover:text-[#45A80A] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            More Tours
                        </Link>
                        <Link href="/" onClick={() => setIsMenuOpen(false)}>
                            <button className="w-full bg-[#45A80A] hover:bg-[#3a8c08] rounded-lg px-6 py-3 text-white transition-colors">
                                Book Now
                            </button>
                        </Link>
                        <div className="flex items-center gap-2 py-2 border-t border-gray-100 mt-2">
                            <Image
                                src="/user-icon.png"
                                alt="user icon"
                                width={40}
                                height={40}
                                className="cursor-pointer"
                                priority
                            />
                            <span className="text-sm text-gray-600">Account</span>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}