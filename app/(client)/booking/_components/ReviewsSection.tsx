"use client"

import {Star} from "lucide-react";
import React from "react";

export const ReviewsSection = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black">Reviews</h2>
                <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-bold text-black">4.8</span>
                    <span className="text-gray-500">(120 Reviews)</span>
                </div>
            </div>
            <div className="space-y-6">
                {[1, 2].map((_, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                                    JD
                                </div>
                                <div>
                                    <h4 className="font-bold text-black">John Doe</h4>
                                    <p className="text-xs text-gray-500">January 12, 2026</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Absolutely amazing experience! The guides were so helpful and ensured our safety throughout the tour. The jumps were exhilarating and the water was perfectly refreshing. Highly recommended!
                        </p>
                    </div>
                ))}
                <button className="w-full py-4 border-2 border-gray-200 text-black font-bold rounded-2xl hover:bg-gray-50 transition">
                    View more reviews
                </button>
            </div>

            {/* Write a Review */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-8">
                <h3 className="text-xl font-bold text-black mb-6">Write a review</h3>
                <form className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-700">Rating:</span>
                        <div className="flex gap-1 cursor-pointer">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-6 h-6 text-gray-300 hover:text-yellow-400 hover:fill-yellow-400 transition" />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <input type="text" placeholder="Your Name" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition" />
                        <input type="email" placeholder="Your Email" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition" />
                    </div>
                    <textarea rows={4} placeholder="Share your experience..." className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition resize-none"></textarea>
                    <button type="button" className="bg-black text-white px-8 py-3.5 rounded-full font-bold hover:bg-gray-800 transition">
                        Submit Review
                    </button>
                </form>
            </div>
        </div>
    );
};