"use client";

import { useState } from "react";

type FAQItemProps = {
title: string;
description: string;
};

export default function InfoDropdown({ title, description }: FAQItemProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col w-full bg-[#F5FFE6] rounded-[15px] items-center shadow-[0_4px_4px_rgba(0,0,0,0.25)] select-none">

            <div
                onClick={() => setOpen(!open)}
                className="flex flex-row justify-between w-full items-center h-[60px] p-8 cursor-pointer"
            >
                <p className="font-poppins font-semibold text-[#3F3F3F] text-[24px]">
                {title}
                </p>

                <span className="text-[#808080] font-bold text-[30px]">
                {open ? "⏶" : "⏷"}
                </span>
            </div>

            <div
                className={`overflow-hidden transition-all duration-500 ${
                open ? "max-h-60 pb-6 pr-6 pl-6 pt-4" : "max-h-0"
                }`}
            >
                <p className="font-poppins font-medium text-[#3F3F3F] text-[20px]">
                {description}
                </p>
            </div>

        </div>
    );
}