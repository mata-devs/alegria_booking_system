"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsPersonFillAdd } from "react-icons/bs";
import { CiCalendar } from "react-icons/ci";
import { LuClock4 } from "react-icons/lu";
import { BsCashStack } from "react-icons/bs";
import { FaCreditCard } from "react-icons/fa6";

export default function BookingPayInfo() {
    const searchParams = useSearchParams();
        const dateParam = searchParams.get("date");
        const timeParam = searchParams.get("time");
        const guestsParam = searchParams.get("guests");
    
        const headPrice: number = 205;
        const serviceCharge: number = 100;
        const mataCharge: number = 100;
        const lguCharge: number = 100;

        const [startDate, setStartDate] = useState<Date | null>(dateParam ? new Date(dateParam) : null);
        const [time, setTime] = useState<Date | null>(timeParam ? new Date(timeParam) : null);
        const [guests, setGuests] = useState<number>(guestsParam ? Number(guestsParam) : 1);

        const [totalPrice, setTotalPrice] = useState<number | null>(null);
        
        const containerRef = useRef<HTMLDivElement | null>(null);
        
        const [openPopup, setOpenPopup] = useState<string | null>(null);

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



    // return(
    //     <div className="w-full h-full">
    //         <h1 className="text-[#BEBEBE]">Forms</h1>
    //     </div>
    // )

    return(
        <div className="
        flex flex-col gap-[2%] h-[100%] w-[100%] shadow-[0_4px_20px_rgba(0,0,0,0.25)] bg-white p-4 rounded rounded-[12px] pt-[5%] pr-[6%] pl-[6%]">
            
            {/* <div className="
            flex 
            flex-row 
            justify-between 
            align-center 
            w-full 
            h-[6%]">
                <div className="flex flex row font-poppins font-semibold text-[24px] text-[#000000] h-[100%]">₱205/<p className="font-poppinns font-medium text-[20px] self-end">Person</p></div>
                <div className="font-poppins font-medium text-[16px] text-[#000000] h-[100%]">rating</div>
            </div> */}

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
            <div className=" h-[15%] flex flex-col gap-[5%]">
                <h3 className="font-poppins font-bold text-[16px] text-[#000000]">Promo Code</h3>
                <h4 className="font-poppins font-regular text-[13px] text-[#BEBEBE]"> Enter you promo code here (optional)</h4>

                {/* Input */}
                <div className=" flex items-center justify-evenly w-full h-[50px] border-[3px] border-[#9F9F9F] rounded-[15px] p-[1%] gap-[2%]">
                    <input className="w-[85%] h-[85%] outline-none text-[#373737] font-poppins font-medium"></input>
                    <button className="w-[15%] h-[85%] cursor-pointer font-poppins font-bold text-[13px] text-[#178893]">Apply</button>
                </div>
            </div>

            {/* Breakdown */}
            <div className=" flex flex-col gap-[2%] h-[20%]">
                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] text-[15px] font-poppins font-semibold">₱205x*{guests}</div>
                    <div className="w-[30%] text-[#000000] text-[15px] font-poppins font-semibold flex justify-end">₱{guests * headPrice}</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] text-[15px] font-poppins font-semibold">Service Charge</div>
                    <div className="w-[30%] text-[#000000] text-[15px] font-poppins font-semibold flex justify-end">₱{serviceCharge}</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] text-[15px] font-poppins font-semibold">Mata</div>
                    <div className="w-[30%] text-[#000000] text-[15px] font-poppins font-semibold flex justify-end">₱{mataCharge}</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] text-[15px] font-poppins font-semibold">LGU</div>
                    <div className="w-[30%] text-[#000000] text-[15px] font-poppins font-semibold flex justify-end">₱{lguCharge}</div>
                </div>

                <div className="w-full h-[3px] bg-[#9F9F9F]">"""</div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] text-[15px] font-poppins font-semibold">Total</div>
                    <div className="w-[30%] text-[#000000] text-[15px] font-poppins font-semibold flex justify-end">₱{totalPrice}</div>
                </div>
                
            </div>

            {/* Mode Of Payment */}
            <div className="w-full flex flex-col items-center h-[25%] gap-[2%]"> 
                <h3 className="text-[#000000] text-[16px] font-poppins font-semibold mr-auto">Select mode of payment</h3>
                <div className="flex flex-col gap-[5%] justify-center w-full h-full pl-[5%] pr-[5%]">
                    <label className="flex flex-row w-full h-[30%] border-[2px] border-[#9D9D9D] rounded-[10px] items-center justify-between pr-[4%] pl-[4%]">
                        <div className="flex flex-1 flex-row items-center gap-[5%] min-w-[20%]">
                            <BsCashStack  className="text-[#4E862C] text-[30px]" />
                            <h3 className="font-poppins font-semibold text-[16px] text-[#525252]">Cash</h3>
                        </div>
                        
                        <input type="radio" name="paymentMethod" value="option1" className="w-6 h-6"/>
                    </label>
                    <label className="flex flex-1 flex-row w-full h-[30%] border-[2px] border-[#9D9D9D] rounded-[10px] items-center justify-between pr-[4%] pl-[4%]">
                        <div className="flex flex-1 flex-row items-center gap-[5%] min-w-[20%]">
                            {/* <BsCashStack  className="text-[#4E862C] text-[30px]" /> */}
                            <Image
                                src="/gcash.png"
                                alt="Gcash Logo"
                                width={50}
                                height={50}
                                />
                                
                            <h3 className="font-poppins font-semibold text-[16px] text-[#525252]">GCash</h3>
                        </div>
                        
                        <input type="radio" name="paymentMethod" value="option2" className="w-6 h-6"/>
                    </label>

                    <label className="flex flex-row w-full h-[30%] border-[2px] border-[#9D9D9D] rounded-[10px] items-center justify-between pr-[4%] pl-[4%]">
                        <div className="flex flex-1 flex-row items-center gap-[5%] min-w-[20%]">
                            <FaCreditCard  className="text-[#4E862C] text-[30px]" />
                            <h3 className="font-poppins font-semibold text-[16px] text-[#525252]">Credit/Debit Card</h3>
                        </div>
                        
                        <input type="radio" name="paymentMethod" value="option3" className="w-6 h-6"/>
                    </label>
                </div>
            </div>

            
        </div>
    )
}