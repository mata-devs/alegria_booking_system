"use client"

import {Clock, Globe, MapPin, Star, Users} from "lucide-react";

export const TourInfoSection = () => {
    return (
        <div className="space-y-6">
            <div
                className="inline-block bg-[#00A3A3] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
                Specific Tour
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight">
                Alegria Canyoneering Tour
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-600">
                <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400"/>
                    <span className="text-black font-bold">4.8</span>
                    <span>(120 reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-gray-400"/>
                    <span>Alegria, Cebu, Philippines</span>
                </div>
            </div>
            <hr className="border-gray-200"/>
            <div className="flex flex-wrap gap-8 md:gap-16 py-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-[#74C00F]"/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Duration</p>
                        <p className="font-bold text-black text-lg">4.5 Hours</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#74C00F]"/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Capacity</p>
                        <p className="font-bold text-black text-lg">Up to 60 pax</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-[#74C00F]"/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Languages</p>
                        <p className="font-bold text-black text-lg">Filipino, English</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
