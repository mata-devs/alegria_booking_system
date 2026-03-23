"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsPersonFillAdd } from "react-icons/bs";
import { CiCalendar } from "react-icons/ci";
import { LuClock4 } from "react-icons/lu";

export default function FloatingSectionDivider() {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [time, setTime] = useState<Date | null>(null);
    const [guests, setGuests] = useState<number>(1);

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [openPopup, setOpenPopup] = useState<string | null>(null);

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
        <div className="relative -mt-[10%] sm:-mt-[6%] lg:-mt-[17%] mb-20 px-4 md:px-8 lg:px-16">

            {/* THE BAR */}
            <div className="max-w-[80%] sm:max-w-[99%] mx-auto bg-white rounded-[20px] sm:rounded-full shadow-lg pt-7 pb-4 px-2  sm:py-5 sm:px-5 lg:px-16">
                <div className="flex flex-col sm:flex-row items-between sm:items-center justify-between gap-11 sm:gap-1 lg:gap-6">
                    <div
                        className=" w-[100%] sm:w-[80%] flex justify-center"
                    >
                        <div
                            className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-1 w-[100%] sm:w-[90%] lg:w-[75%]"
                        >
                            {/* Date Section */}
                            <div className="flex items-center gap-3 pl-[20%] sm:pl-0">
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
                                                setOpenPopup(null); // close after selecting
                                                }}
                                                inline // forces calendar to render here, not as input popup
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-poppins font-bold text-[16px] sm:text-[14px] lg:text-[20px] text-[#000000]">
                                    {startDate ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                                        : "Select Date"}
                                    </p>
                            
                                    <p className="text-[11px] lg:text-sm text-gray-500">Date</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-[full] h-[2px] sm:w-[1px] sm:h-10 bg-gray-300"></div>

                            {/* Time Section */}
                            <div className="flex items-center gap-3 sm:justify-center pl-[20%] sm:pl-0">
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
                                    onClick={() => setOpenPopup(openPopup === "time" ? null : "time")}
                                    className="cursor-pointer">
                                        <LuClock4 color="#AED471" size={40} strokeWidth={2} />
                                    </button>
                                    {/* Time picker popup */}
                                    {openPopup === "time" && (
                                        <div ref={containerRef} className="absolute top-full left-0 z-50 mt-2 bg-white shadow-lg p-2 rounded">
                                        <DatePicker
                                            selected={time}
                                            onChange={(date: Date | null) => {
                                            setTime(date);
                                            setOpenPopup(null); // close after selecting
                                            }}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={15} // choose 15-minute steps
                                            timeCaption="Time"
                                            dateFormat="h:mm aa" // renders as 8:00 AM format
                                            inline
                                        />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className=" font-poppins font-bold text-[16px] sm:text-[14px] lg:text-[20px] text-[#000000]">
                                    {time ? time .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
                                        : "--:--"}
                                    </p>
                                    <p className="text-[11px] lg:text-sm text-gray-500">Time</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-[full] h-[2px] sm:w-[1px] sm:h-10 bg-gray-300"></div>

                            {/* Guests Section */}
                            <div className="flex items-center gap-3 pl-[20%] sm:pl-0">
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
                                            onChange={(e) => setGuests(Number(e.target.value))}
                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:outline-none"
                                            placeholder="Guests"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-poppins font-bold text-[16px] sm:text-[14px] lg:text-[20px] text-[#000000]">{guests}</p>
                                    <p className="font-poppins font-medium text-[11px] lg:text-sm text-[#BEBEBE]">Guests</p>
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
                            date: startDate ? startDate.toISOString() : "",
                            time: time ? time.toISOString() : "",
                            guests: guests.toString(),
                            },
                        }}
                        className="w-full sm:w-auto"
                        
                        >
                    <button className="bg-[#178893]  hover:bg-teal-700 text-white font-semibold w-[100%] sm:px-10 lg:px-16 py-2 lg:py-3 rounded-full transition-colors cursor-pointer">
                        Book
                    </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}