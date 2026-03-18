"use client";

import { CiCalendar } from "react-icons/ci";
import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { LuClock4 } from "react-icons/lu";
import { BsPersonFillAdd } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { useSearchParams } from "next/navigation";
// import { Link } from "lucide-react";
import Link from "next/link";

// interface BookingSmallProps {
//     date?: string;
//     time?: string;
//     guests?: string;
// }

export default function BoookingSmall() {

    const searchParams = useSearchParams();
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    const guestsParam = searchParams.get("guests");

    const headPrice: number = 205;
    const serviceCharge: number = 100;
    const mataCharge: number = 100;
    const lguCharge: number = 100;

    // const [startDate, setStartDate] = useState<Date | null>(null);
    // const [time, setTime] = useState<Date | null>(null);
    // const [guests, setGuests] = useState<number>(1);
    const [startDate, setStartDate] = useState<Date | null>(dateParam ? new Date(dateParam) : null);
    const [time, setTime] = useState<Date | null>(timeParam ? new Date(timeParam) : null);
    const [guests, setGuests] = useState<number>(guestsParam ? Number(guestsParam) : 1);

    // const [startDate, setStartDate] = useState<Date | null>(dateFromQuery ? new Date(dateFromQuery) : null);
    // const [isOpen, setIsOpen] = useState(false);

    // const [time, setTime] = useState<Date | null>(timeFromQuery ? new Date(timeFromQuery) : null);
    // const [isTimeOpen, setIsTimeOpen] = useState(false);

    // const [guests, setGuests] = useState<number>(guestsFromQuery ? Number(guestsFromQuery) : 1);
    // const [isGuestsOpen, setIsGuestsOpen] = useState(false);
    const [totalPrice, setTotalPrice] = useState<number | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [openPopup, setOpenPopup] = useState<string | null>(null);

    // // Optional: sync state if props change
    // useEffect(() => {
    //     if (dateFromQuery) setStartDate(new Date(dateFromQuery));
    //     if (timeFromQuery) setTime(new Date(timeFromQuery));
    //     if (guestsFromQuery) setGuests(Number(guestsFromQuery));
    // }, [dateFromQuery, timeFromQuery, guestsFromQuery]);

    // // Hydrate only after client mount
    // useEffect(() => {
    //     if (dateFromQuery) {
    //     const d = new Date(dateFromQuery);
    //     if (!isNaN(d.getTime())) setStartDate(d);
    //     }

    //     if (timeFromQuery) {
    //     const t = new Date(timeFromQuery);
    //     if (!isNaN(t.getTime())) setTime(t);
    //     }

    //     if (guestsFromQuery) {
    //     const g = Number(guestsFromQuery);
    //     if (!isNaN(g)) setGuests(g);
    //     }
    // }, [dateFromQuery, timeFromQuery, guestsFromQuery]);

    useEffect(() => {
        const total =
            guests * headPrice +
            serviceCharge +
            mataCharge +
            lguCharge;

        setTotalPrice(total);
    }, [guests]);

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




    return(
        <div className="
        flex flex-col gap-[5%] aspect-[10/13] w-[23vw] shadow-[0_4px_20px_rgba(0,0,0,0.25)] bg-white p-4 rounded rounded-[12px] pt-[5%] pr-[6%] pl-[6%]">
            
            <div className="
            flex 
            flex-row 
            justify-between 
            align-center 
            w-full 
            h-[6%]">
                <div className="flex flex row font-poppins font-semibold text-[24px] text-[#000000] h-[100%]">₱205/<p className="font-poppinns font-medium text-[20px] self-end">Person</p></div>
                <div className="font-poppins font-medium text-[16px] text-[#000000] h-[100%]">rating</div>
            </div>

            {/* Time & Guests */}
            <div className="flex flex-col mt-[7%] w-full border-[3px] border-[#9F9F9F] h-[30%] rounded-[30px]">

                {/* Date & Time */}
                <div className=" flex flex-row justify-between items-center w-full h-[50%] border-b-[2px] border-[#9F9F9F] pr-[5%] pl-[5%]">
                    {/* Date */}
                    <div  className="flex flex-row w-[55%]">
                        <div>
                            <button onClick={() => setOpenPopup(openPopup === "date" ? null : "date")} className="cursor-pointer">
                                <CiCalendar color="#686868" size={40} strokeWidth={1}/>
                            </button>
                            {openPopup === "date" && (
                            <div ref={containerRef} className="absolute z-50 mt-2 bg-white shadow-lg p-2 rounded">
                                <DatePicker
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

                        <div className="flex flex-col">
                            <p className="font-poppins font-bold text-[16px] text-[#000000]">
                            {startDate ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                                : "Select Date"}
                            </p>
                            <p className="font-poppins font-medium text-[12px] text-[#BEBEBE]">Date</p>

                        </div>
                    </div>

                     {/* Time */}
                    <div className="flex flex-row justify-start w-[45%]">
                        <div className="relative">
                            {/* Button to open the time picker */}
                            <button
                                onClick={() => setOpenPopup(openPopup === "time" ? null : "time")}
                                className="cursor-pointer"
                            >
                                <LuClock4 color="#686868" size={40} strokeWidth={2} />
                            </button>
                            {/* Time picker popup */}
                            {openPopup === "time" && (
                                <div ref={containerRef} className="absolute z-50 mt-2 bg-white shadow-lg p-2 rounded">
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

                        <div className="flex flex-col">
                            <p className="font-poppins font-bold text-[16px] text-[#000000]">
                            {time ? time .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
                                : "--:--"}
                            </p>
                            <p className="font-poppins font-medium text-[12px] text-[#BEBEBE]">Time</p>

                        </div>
                        
                    </div>
                </div>

                {/* Guests */}
                <div className="w-full h-[50%] px-[5%] flex flex-row items-center gap-[2%]">
                    <div className="relative">
                        <button
                        onClick={() => setOpenPopup(openPopup === "guests" ? null : "guests")}
                        className="cursor-pointer"
                        >
                        <BsPersonFillAdd color="#686868" size={40} />
                        </button>

                        {openPopup === "guests" && (
                            <div ref={containerRef} className="absolute z-50 mt-2 w-[10vw] bg-white shadow-lg p-2 rounded">
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
                    <div className="flex flex-col ">
                        <p className="font-poppins font-bold text-[16px] text-[#000000]">{guests}</p>
                        <p className="font-poppins font-medium text-[12px] text-[#BEBEBE]">Guests</p>
                    </div>
                </div>

            </div>

            {/* Promo Code */}
            <div className=" h-[25%] flex flex-col gap-[5%]">
                <h3 className="font-poppins font-bold text-[20px] text-[#000000]">Promo Code</h3>
                <h4 className="font-poppins font-regular text-[15px] text-[#BEBEBE]"> Enter you promo code here (optional)</h4>

                {/* Input */}
                <div className=" flex items-center justify-evenly w-full h-[40%] border-[3px] border-[#9F9F9F] rounded-[15px] p-[2%] gap-[2%]">
                    <input className="w-[85%] h-[85%] outline-none text-[#373737] font-poppins font-medium"></input>
                    <button className="w-[15%] h-[85%] cursor-pointer font-poppins font-bold text-[15px] text-[#178893]">Apply</button>
                </div>
            </div>

            {/* Breakdown */}
            <div className=" flex flex-col gap-[2%] h-[20%]">
                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">₱205x*{guests}</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">₱{guests * headPrice}</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">Service Charge</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">₱{serviceCharge}</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">Mata</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">₱{mataCharge}</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">LGU</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">₱{lguCharge}</div>
                </div>

                <div className="w-full h-[3px] bg-[#9F9F9F]">"""</div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">Total</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">₱{totalPrice}</div>
                </div>
                
            </div>

            {/* Button */}
            <div className="w-full flex justify-center h-[20%] mt-[10%]"> 
                {/* <Link href="/guestbooking" */}
                <Link href={{
                            pathname: "/guestbooking",
                            query: {
                            date: startDate ? startDate.toISOString() : "",
                            time: time ? time.toISOString() : "",
                            guests: guests.toString(),
                            },
                        }}
                className="w-full h-full flex justify-center">
                    <button className="bg-[#7BCA0D] w-[90%] h-[50%] rounded-[30px] text-[#FFFFFF] font-poppins font-medium text-[24px] cursor-pointer">Reserve</button>
                </Link>
            </div>

            
        </div>
    )
}