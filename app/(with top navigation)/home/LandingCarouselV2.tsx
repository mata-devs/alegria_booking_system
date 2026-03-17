"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Lightbox from "@/components/Lightbox";

export default function LandingCarouselV2() {

    const galleryImages = [
        { id: 1, image: "/booking-page-image-1.png", alt: "Boulder rocks adventure 1" },
        { id: 2, image: "/booking-page-image-2.png", alt: "Boulder rocks adventure 2" },
        { id: 3, image: "/booking-page-image-3.png", alt: "Boulder rocks adventure 3" },
        { id: 4, image: "/booking-page-image-4.png", alt: "Boulder rocks adventure 4" },
        { id: 5, image: "/booking-page-image-5.png", alt: "Boulder rocks adventure 5" },
        { id: 6, image: "/booking-page-image-2.png", alt: "Boulder rocks adventure 6" }
    ];

    const visibleImages = 4;

    const [index, setIndex] = useState(0);
    const [transition, setTransition] = useState(true);

    // rotate array based on index
    const rotatedImages = [
    ...galleryImages.slice(index),
    ...galleryImages.slice(0, index)
    ];

    const visible = rotatedImages.slice(0, visibleImages);

    const nextSlide = () => {
        setTransition(true);
        setIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevSlide = () => {
        setTransition(true);
        setIndex((prev) =>
        (prev - 1 + galleryImages.length) % galleryImages.length
        );
    };

    useEffect(() => {
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, []);


    // LIGHTBOX
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const handleNext = () => {
        setLightboxIndex((prev) => {
        if (prev === null) return 0;
        return (prev + 1) % galleryImages.length;
        });
    };

    const handlePrev = () => {
        setLightboxIndex((prev) => {
        if (prev === null) return 0;
        return (prev - 1 + galleryImages.length) % galleryImages.length;
        });
    };

    return (

        <div className="relative w-full flex flex-col items-center pb-20 mt-[20vh] mb-[15vh]">

            <div className="flex items-center w-full justify-center p-15">
                <h2 className="lg:text-[64px] md:text-4xl font-bold text-center text-[#3F8814]">
                Gallery
                </h2>
            </div>

            <div className="relative w-full flex items-center">

                <button
                onClick={prevSlide}
                className="absolute left-0 z-10 bg-white shadow-md rounded-full w-10 h-10"
                >
                ◀
                </button>
                <div className="overflow-hidden w-full">
                    <div
                        className={`flex ${transition ? "transition-transform duration-500 ease-in-out" : ""}`}
                        >
                        {visible.map((img, i) => (
                        <div key={img.id} className="w-1/4 flex-shrink-0 p-6">
                            <div
                            className="relative w-full aspect-square cursor-pointer"
                            onClick={() => setLightboxIndex((index + i) % galleryImages.length)}
                            >
                            <Image
                            src={img.image}
                            alt={img.alt}
                            fill
                            className="object-cover rounded-lg"
                            />
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
                <button
                onClick={nextSlide}
                className="absolute right-0 z-10 bg-white shadow-md rounded-full w-10 h-10"
                >
                ▶
                </button>
            </div>

            <Lightbox
            images={galleryImages}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNext={handleNext}
            onPrev={handlePrev}
            />

        </div>
    );
}