"use client";

import Image from "next/image";

export const TourInfoSection = () => {
    return (
        <div className="w-full flex flex-col gap-[3%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%] pb-[5%] font-poppins">
            <div className="inline-flex self-start justify-center bg-[#7CBBC2] px-3 py-1.5 font-medium text-[14px] rounded-[28px] text-[#007D99]">
                Specific Tour
            </div>

            <div className="flex items-center pt-[1%] pb-[1%]">
                <h1 className="text-[#000000] text-[32px] md:text-[40px] leading-tight">
                    Alegria Canyoneering Tour
                </h1>
            </div>

            <div className="flex flex-wrap w-full gap-x-[5%] gap-y-2">
                <div className="flex flex-row items-center gap-1.5">
                    <div className="relative w-4 h-4 shrink-0">
                        <Image src="/star.png" alt="" fill className="object-contain" />
                    </div>
                    <span className="text-[16px] text-[#000000] font-medium">4.8 (120 reviews)</span>
                </div>
                <div className="flex flex-row items-center gap-1.5">
                    <div className="relative w-4 h-4 shrink-0">
                        <Image src="/pin_location.png" alt="" fill className="object-contain" />
                    </div>
                    <span className="text-[16px] text-[#000000] font-medium">Alegria, Cebu, Philippines</span>
                </div>
            </div>

            <div className="flex gap-[15px] items-center flex-row w-full">
                <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden">
                    <Image src="/profile.png" alt="Host profile" fill className="object-cover" />
                </div>
                <div className="flex flex-row flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-[16px] text-[#898989]">Hosted by</span>
                    <span className="font-bold text-[16px] text-[#000000]">Juan Dela Cruz</span>
                </div>
            </div>

            <div>
                <hr className="w-full border-t-[3px] border-[#9D9D9D] my-4" />
            </div>

            <div className="flex flex-wrap w-full gap-x-[10%] gap-y-4">
                <div className="flex flex-row items-center gap-[5%]">
                    <div className="relative w-6 h-6 shrink-0">
                        <Image src="/clock_small.png" alt="" fill className="object-contain" />
                    </div>
                    <span className="text-[16px] text-[#272727] font-medium">4.5 Hours</span>
                </div>
                <div className="flex flex-row items-center gap-[5%]">
                    <div className="relative w-6 h-6 shrink-0">
                        <Image src="/people_small.png" alt="" fill className="object-contain" />
                    </div>
                    <span className="text-[16px] text-[#272727] font-medium">Up to 60 pax</span>
                </div>
                <div className="flex flex-row items-center gap-[5%]">
                    <div className="relative w-6 h-6 shrink-0">
                        <Image src="/language_small.png" alt="" fill className="object-contain" />
                    </div>
                    <span className="text-[16px] text-[#272727] font-medium">Filipino, English</span>
                </div>
            </div>
        </div>
    );
};
