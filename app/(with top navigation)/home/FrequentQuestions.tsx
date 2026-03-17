"use client";

import { useState } from "react";
import InfoDropdown from "./InfoDropdown";
import Image from "next/image";
export default function FrequentQuestions() {
    const [open1, setOpen1] = useState(false);


    return (
        <div className="flex flex-col w-full min-h-[80vh] gap-[3%] mt-[15vh] pt-[3%] pr-[5%] pl-[5%] pb-[5%] ">
            <div>
                <h1 className="font-poppins font-bold text-[#3F8814] text-[64px] pt-[1%] pb-[1%]">
                    Frequntly Asked Questions 
                </h1>
            </div>
            {/* Content */}
            <div className="flex flex-row w-full h-full gap-[5%]">  
                
                {/* LEFT */}
                <div className="gap-8 w-[55%] h-full flex flex-col justify-center pt-[3%]">
                    <InfoDropdown
                        title="1.) What is Canyoneering?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />

                    <InfoDropdown
                        title="2.) Where is Alegria Canyoneering located?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />

                    <InfoDropdown
                        title="3.) How long does the canyoneering activity take?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />

                    <InfoDropdown
                        title="4.) Is Alegria Canyoneering safe?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />
                </div>
                {/* RIGHT */}
                <div className=" w-[30%] h-[50vh] flex relative justify-center ">
                        <div className="relative w-[100%] h-[100%]">
                        <Image src="/QA-Image.png"
                            alt="first picture"
                            fill
                            sizes=""
                            className="object-contain"
                        />
                        </div>
                    
                </div>

            </div>
            
        </div>
    )
}