"use client"

import React from "react";
import {CheckCircle2} from "lucide-react";

export const ExperienceSection = () => {
    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Experience</h2>
                <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
                    <p>Get ready for an adrenaline-pumping adventure in the lush jungles of Alegria. This canyoneering tour takes you through stunning canyons, vibrant blue waters, and magnificent natural rock formations.</p>
                    <div className="space-y-3 mt-6">
                        <div className="flex gap-4">
                            <b className="text-black min-w-[120px]">07:00 – 08:00</b>
                            <p className="m-0">Arrival, registration, and safety briefing at the headquarters.</p>
                        </div>
                        <div className="flex gap-4">
                            <b className="text-black min-w-[120px]">08:00 – 10:30</b>
                            <p className="m-0">Begin the trek, jump off waterfalls, swim through narrow gorges, and slide down natural water slides.</p>
                        </div>
                        <div className="flex gap-4">
                            <b className="text-black min-w-[120px]">10:30 – 11:30</b>
                            <p className="m-0">Reach Kawasan falls, relax, swim, and take memorable photos.</p>
                        </div>
                        <div className="flex gap-4">
                            <b className="text-black min-w-[120px]">11:30 – 12:30</b>
                            <p className="m-0">Enjoy a hearty local lunch included in your package.</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* Include Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Include</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        "Professional local guides",
                        "Safety gear (helmet, life vest)",
                        "Entrance and environmental fees",
                        "Complimentary bottled water",
                        "Hearty lunch meal",
                        "Motorcycle ride to jumping point"
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-[#74C00F]" />
                            <span className="text-gray-700 font-medium text-sm">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};