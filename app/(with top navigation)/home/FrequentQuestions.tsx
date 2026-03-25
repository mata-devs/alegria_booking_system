"use client";

import { useState } from "react";
import InfoDropdown from "./InfoDropdown";
import Image from "next/image";
export default function FrequentQuestions() {
    const [open1, setOpen1] = useState(false);


    return (
        <div className="flex flex-col w-full min-h-[50vh] gap-[3%] mt-[10vh] pt-[3%] px-[5%] pb-[5%] ">
            <div className="flex flex-row justify-center lg:justify-start">
                <h1 className="font-poppins font-bold text-[#3F8814] text-[24px] sm:text-[32px] lg:text-[60px] pt-[1%] pb-[1%]">
                    Frequntly Asked Questions 
                </h1>
            </div>
            {/* Content */}
            <div className="flex flex-col-reverse  sm:flex-row justify-between lg:justify-start w-full h-full gap-[3%] lg:gap-[5%]">  
                
                {/* LEFT */}
                <div className="gap-8 w-full sm:w-[60%] lg:w-[55%] h-full flex flex-col justify-center pt-[3%]">
                    <InfoDropdown
                        title="What is Canyoneering?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />

                    <InfoDropdown
                        title="Where is Alegria Canyoneering located?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />

                    <InfoDropdown
                        title="How long does the canyoneering activity take?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />

                    <InfoDropdown
                        title="Is Alegria Canyoneering safe?"
                        description="Canyoneering is a sport that involves climbing mountains and other natural environments. It is a physical and mental challenge that requires a strong sense of balance, coordination, and fitness."
                    />
                </div>
                {/* RIGHT */}
                <div className="w-full sm:w-[40%] lg:w-[30%] h-[30vh] sm:h-[50vh] flex relative justify-center ">
                        <div className="relative w-[70%] sm:w-[100%] h-[100%]">
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