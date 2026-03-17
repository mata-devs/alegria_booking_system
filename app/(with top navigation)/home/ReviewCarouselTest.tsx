"use client";

import { useState, useEffect } from "react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
import Image from "next/image";
import Lightbox from "@/components/Lightbox";

export default function ReviewCarouselTest() {

    const galleryImages = [
        { id: 1, name: "Juan Delgado", email: "juan@email.com", nationality: "AD", address: "Cebu", rating:"4", review:"Lorem ipsum dolor sit amet, consectetur adipiscing elit,sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."},
        { id: 2, name: "Juan Delgado", email: "juan@email.com", nationality: "AD", address: "Cebu", rating:"4", review:"Lorem ipsum dolor sit amet, consectetur adipiscing elit,sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."},
        { id: 3, name: "Juan Delgado", email: "juan@email.com", nationality: "AD", address: "Cebu", rating:"4", review:"Lorem ipsum dolor sit amet, consectetur adipiscing elit,sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."},
        { id: 4, name: "Juan Delgado", email: "juan@email.com", nationality: "AD", address: "Cebu", rating:"4", review:"Lorem ipsum dolor sit amet, consectetur adipiscing elit,sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."},
        { id: 5, name: "Juan Delgado", email: "juan@email.com", nationality: "AD", address: "Cebu", rating:"4", review:"Lorem ipsum dolor sit amet, consectetur adipiscing elit,sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."},
        { id: 6, name: "Juan Delgado", email: "juan@email.com", nationality: "AD", address: "Cebu", rating:"4", review:"Lorem ipsum dolor sit amet, consectetur adipiscing elit,sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."},
    ];

    const visibleImages = 2;

    const clonedSlides = [
        ...galleryImages.slice(-visibleImages),
        ...galleryImages,
        ...galleryImages.slice(0, visibleImages)
    ];

    const [index, setIndex] = useState(visibleImages);
    const [transition, setTransition] = useState(true);
    const maxIndex = galleryImages.length - visibleImages;

    // const nextSlide = () => {
    //     setIndex((prev) => prev + 1);
    // };

    // const prevSlide = () => {
    //     setIndex((prev) => prev - 1);
    // };

    const nextSlide = () => {
        setIndex((prev) => prev + 1);
        // setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        // setIndex((prev) => {
        // const next = prev + 1;
        // return next > maxIndex ? 0 : next;
    // });
    };

    const prevSlide = () => {
        setIndex((prev) => prev - 1);
        // setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
        // setIndex((prev) => {
        // const next = prev - 1;
        // return next < 0 ? maxIndex : next;
    // });
    };

    const handleTransitionEnd = () => {

        // if (index === clonedSlides.length - visibleImages) {
        //     setTransition(false);
        //     setIndex(visibleImages);
        // }

        // if (index === 0) {
        //     setTransition(false);
        //     setIndex(galleryImages.length);
        // }
        // reached right clone
        if (index === galleryImages.length + visibleImages) {
            setTransition(false);
            setIndex(visibleImages);
        }

        // reached left clone
        if (index === visibleImages - 1) {
            setTransition(false);
            setIndex(galleryImages.length + visibleImages - 1);
        }
        };

    const enableTransition = () => {
        if (!transition) {
            setTimeout(() => setTransition(true), 50);
        }
    };

    useEffect(() => {
        if (!transition) {
            requestAnimationFrame(() => setTransition(true));
        }
    }, [transition]);

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         nextSlide();
    //     }, 4000);

    //     return () => clearInterval(interval);
    // }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const startCarousel = () => {
            interval = setInterval(() => {
                setIndex((prev) => prev + 1);
            }, 4000);
        };

        const stopCarousel = () => {
            if (interval) clearInterval(interval);
        };

        const handleVisibility = () => {
            if (document.hidden) {
                stopCarousel(); // pause when tab hidden
            } else {
                startCarousel(); // resume when visible
            }
        };

        startCarousel();

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            stopCarousel();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);


    // LIGHTBOX
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
            className="absolute left-0 z-10 bg-white shadow-md rounded-full w-10 h-10 cursor-pointer"
            >
            ◀
        </button>
        <div className="overflow-hidden w-full">
            <div
                onTransitionEnd={() => {
                    handleTransitionEnd();
                    enableTransition();
                    }}
                    className={`flex ${transition ? "transition-transform duration-500 ease-in-out" : ""}`}
                    style={{
                    transform: `translateX(-${index * 50}%)`,
                    }}
                    >

                    {clonedSlides.map((review, i) => (
                        <div className="w-1/2 flex-shrink-0 p-6 flex justify-center">
                            <div key={i} className=" w-[650px] h-[300px] p-4 bg-[#F5FFE6] rounded-[30px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                            {/* Upper */}
                                <div className="w-full h-[30%] flex flex-row items-center justify-between">
                                    <div className="flex flex-row w-[60%] items-center gap-5 pl-4">
                                        {/* <div className="flex aspect-[1/1] w-15 h-15 bg-[#F3C3B5] rounded-full justify-center items-center">
                                        </div> */}
                                        <CircleFlag countryCode={review.nationality} className="w-20 h-20" />

                                        <div >
                                            <p className="font-poppins font-semibold text-[#000000] text-[24px]">
                                                {review.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-row w-[20%] item-center justify-end pr-4">
                                        <span className="text-[#F0A822] text-4xl">★</span>
                                        <span className="text-[#898989] text-[24px]">{review.rating}/5</span> 
                                    </div>
                                    
                                </div>

                                {/* Lower */}
                                <div className="flex w-full h-[70%] pl-4 pr-4 pt-2">
                                    <p className="font-poppins font-regular text-[#000000] text-[20px]">{review.review}</p>
                                </div>
                            
                            </div>
                    </div>
                ))}
            </div>
        </div>

        <button
            onClick={nextSlide}
            className="absolute right-0 z-10 bg-white shadow-md rounded-full w-10 h-10 cursor-pointer"
            >
            ▶
        </button>

    </div>

    </div>
    );
}