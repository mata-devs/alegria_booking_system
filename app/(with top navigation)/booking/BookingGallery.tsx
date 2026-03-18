"use client";

import { useState } from "react";
import ShowAllButton from "./ShowAllButton";
import Image from "next/image";
import Lightbox from '@/app/(with top navigation)/components/Lightbox';

export default function BookingGallery() {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    
    const galleryImages = [
        { id: 1, image: '/booking-page-image-1.png', alt: 'Boulder rocks adventure 1' },
        { id: 2, image: '/booking-page-image-2.png', alt: 'Boulder rocks adventure 2' },
        { id: 3, image: '/booking-page-image-3.png', alt: 'Boulder rocks adventure 3' },
        { id: 4, image: '/booking-page-image-4.png', alt: 'Boulder rocks adventure 4' },
        { id: 5, image: '/booking-page-image-5.png', alt: 'Boulder rocks adventure 5' },
    ];

    const handleNext = () => {
        setLightboxIndex((prev) => {
        if (prev === null) return 0;
        return prev === galleryImages.length - 1 ? 0 : prev + 1;
        });
    };

    const handlePrev = () => {
        setLightboxIndex((prev) => {
        if (prev === null) return 0;
        return prev === 0 ? galleryImages.length - 1 : prev - 1;
        });
    };

    return(
        <div className="flex flex-row justify-center gap-[1%] pt-[3%] pb-[2%] w-full h-[100vh]">
                    <div className="flex w-[70%]">
                        <div className=" w-full aspect-[56:45] relative aspect-square overflow-hidden rounded-[25px] group">
                            {/* <ShowAllButton /> */}
                            <button className="h-[40px] w-[178px] rounded-[12px] font-poppins font-medium text-[15px] text-[#616161] cursor-pointer gap-3 z-10 absolute bg-white flex flex-row bottom-3 left-5 items-center justify-center"
                                    onClick={() => setLightboxIndex(1)}>
                                        <Image src="/images_icon.png" alt="arrow" width={20} height={20}/>
                                        Show All Images
                            </button>
                            <Image src="/booking-page-image-2.png"
                                    alt="first picture"
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    className="object-cover"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-[2%] justify-between w-[30%] h-full">
                        <div className="w-full relative aspect-square overflow-hidden rounded-[25px] group">
                            <Image src="/booking-page-image-1.png"
                                    alt="first picture"
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    className="object-cover"
                                />
                        </div>
        
                        <div className="bg-lime-50 w-[100%] relative aspect-square overflow-hidden rounded-[25px] group">
                            <Image src="/booking-page-image-3.png"
                                    alt="first picture"
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    className="object-cover"
                                />
                        </div>
                        <div className="bg-lime-50 w-[100%] relative aspect-square overflow-hidden rounded-[25px] group">
                            <Image src="/booking-page-image-4.png"
                                    alt="first picture"
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    className="object-cover"
                                />
                        </div>
                    </div>
                    <Lightbox
                        images={galleryImages}
                        currentIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
            </div>   
    )
}