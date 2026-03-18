"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsPersonFillAdd } from "react-icons/bs";
import { CiCalendar } from "react-icons/ci";
import { LuClock4 } from "react-icons/lu";
import { formatBookingDisplayDate, formatBookingDisplayTime } from "@/lib/date-utils";


const buildScheduleTime = (hours: 8 | 13, date: Date | null): Date => {
    const base = date ? new Date(date) : new Date();
    base.setHours(hours, 0, 0, 0);
    return base;
};

const TIME_OPTIONS = [
    { label: "8:00 AM", hours: 8 as const },
    { label: "1:00 PM", hours: 13 as const },
];

export default function FloatingSectionDivider() {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [time, setTime] = useState<Date | null>(null);
    const [guests, setGuests] = useState<number>(1);

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [openPopup, setOpenPopup] = useState<string | null>(null);

    const handleTimeSelection = (hours: 8 | 13) => {
        setTime(buildScheduleTime(hours, startDate));
        setOpenPopup(null);
    };

    useEffect(() => {
        if (!openPopup) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current &&
                !containerRef.current.contains(event.target as Node)) {
                setOpenPopup(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [openPopup]);





    
    return (
        <div className="relative -mt-60 mb-20 px-4 md:px-8 lg:px-16">
            <div className="max-w-[99%] mx-auto bg-white rounded-full shadow-lg p-6 md:py-6 md:px-16">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div
                        className=" w-[80%] flex justify-center"
                    >
                        <div
                            className="flex justify-between w-[75%]"
                        >
                            {/* Date Section */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-lg flex items-center justify-center">
                                    {/* <Image
                                        className=""
                                        src="/calendar.png"
                                        alt="calendar icon"
                                        width={60}
                                        height={60}
                                        priority
                                    /> */}
                                    <button 
                                    onClick={() => setOpenPopup(openPopup === "date" ? null : "date")} 
                                    className="cursor-pointer">
                                    <CiCalendar  color="#AED471" size={40} strokeWidth={1}/>
                                    </button>
                                    {openPopup === "date" && (
                                        <div ref={containerRef} className="absolute top-full left-0 z-50 mt-2 bg-white shadow-lg p-2 rounded">
                                            <DatePicker
                                                key={openPopup}
                                                selected={startDate}
                                                onChange={(date: Date | null) => {
                                                    setStartDate(date);
                                                    if (date && time) {
                                                        const nextTime = new Date(date);
                                                        nextTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
                                                        setTime(nextTime);
                                                    }
                                                    setOpenPopup(null); // close after selecting
                                                }}
                                                inline // forces calendar to render here, not as input popup
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-poppins font-bold text-[20px] text-[#000000]">
                                    {startDate ? formatBookingDisplayDate(startDate)
                                        : "Select Date"}
                                    </p>
                            
                                    <p className="text-sm text-gray-500">Date</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-10 bg-gray-300"></div>

                            {/* Time Section */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-20 h-10 rounded-lg flex items-center justify-center">
                                    {/* <Image
                                        className=""
                                        src="/guests.png"
                                        alt="guests icon"
                                        width={60}
                                        height={60}
                                        priority
                                    /> */}
                                    <button
                                    onClick={() => setOpenPopup(openPopup === "time" ? null : "time")}
                                    className="cursor-pointer">
                                        <LuClock4 color="#AED471" size={40} strokeWidth={2} />
                                    </button>
                                    {/* Time picker popup */}
                                    {openPopup === "time" && (
                                        <div ref={containerRef} className="absolute top-full left-0 z-50 mt-2 bg-white shadow-lg p-2 rounded">
                                            <div className="flex w-40 flex-col gap-2">
                                                {TIME_OPTIONS.map((option) => {
                                                    const isSelected = time?.getHours() === option.hours && time.getMinutes() === 0;

                                                    return (
                                                        <button
                                                            key={option.label}
                                                            type="button"
                                                            onClick={() => handleTimeSelection(option.hours)}
                                                            className={`rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${isSelected
                                                                    ? "bg-[#178893] text-white"
                                                                    : "bg-white text-gray-700 hover:bg-[#F5FFE6]"
                                                                }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="w-31 font-poppins font-bold text-[20px] text-[#000000]">
                                    {time ? formatBookingDisplayTime(time)
                                        : "--:--"}
                                    </p>
                                    <p className="text-sm text-gray-500">Time</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-10 bg-gray-300"></div>

                            {/* Guests Section */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-lg flex items-center justify-center">
                                    {/* <Image
                                        className=""
                                        src="/guests.png"
                                        alt="guests icon"
                                        width={60}
                                        height={60}
                                        priority
                                    /> */}
                                    <button
                                    // onClick={() => setIsTimeOpen(!isTimeOpen)}
                                    onClick={() => setOpenPopup(openPopup === "guests" ? null : "guests")}
                                    className="cursor-pointer">
                                        <BsPersonFillAdd color="#AED471" size={40} />
                                    </button>
                                    {openPopup === "guests" && (
                                        <div ref={containerRef} className="absolute top-full left-0 z-50 mt-2 w-[6vw] bg-white shadow-lg p-2 rounded">
                                            <input
                                            type="number"
                                            min={1}
                                            value={guests ?? ""}
                                            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:outline-none"
                                            placeholder="Guests"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-poppins font-bold text-[20px] text-[#000000]">{guests}</p>
                                    <p className="font-poppins font-medium text-[12px] text-[#BEBEBE]">Guests</p>
                                </div>
                            </div>

                            
                        </div>
                    </div>

                    {/* Book Button */}
                    {/* <Link href="/booking"> */}
                    <Link
                        href={{
                            pathname: "/booking",
                            query: {
                            date: startDate ? formatBookingDisplayDate(startDate) : "",
                            time: time ? formatBookingDisplayTime(time) : "",
                            guests: guests.toString(),
                            },
                        }}>
                    <button className="bg-[#178893] hover:bg-teal-700 text-white font-semibold px-16 py-3 rounded-full transition-colors cursor-pointer">
                        Book
                    </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}