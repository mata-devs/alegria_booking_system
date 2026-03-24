"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Lightbox from "@/components/Lightbox";

export default function LandingCarousel() {

    const galleryImages = [
        { id: 1, image: "/booking-page-image-1.png", alt: "Boulder rocks adventure 1" },
        { id: 2, image: "/booking-page-image-2.png", alt: "Boulder rocks adventure 2" },
        { id: 3, image: "/booking-page-image-3.png", alt: "Boulder rocks adventure 3" },
        { id: 4, image: "/booking-page-image-4.png", alt: "Boulder rocks adventure 4" },
        { id: 5, image: "/booking-page-image-5.png", alt: "Boulder rocks adventure 5" },
        { id: 6, image: "/booking-page-image-2.png", alt: "Boulder rocks adventure 6" },
    ];

    // const visibleImages = 4;

    const [visibleImages, setVisibleImages] = useState(4);

    useEffect(() => {
        const updateVisibleImages = () => {
            if (window.innerWidth < 768) {
            setVisibleImages(2); // mobile
            } else if (window.innerWidth < 1024) {
            setVisibleImages(3); // tablet
            } else {
            setVisibleImages(4); // desktop
            }
        };

        updateVisibleImages();
        window.addEventListener("resize", updateVisibleImages);

        return () => window.removeEventListener("resize", updateVisibleImages);
    }, []);


    const clonedSlides = [
        ...galleryImages.slice(-visibleImages),
        ...galleryImages,
        ...galleryImages.slice(0, visibleImages),
    ];

    const [index, setIndex] = useState(visibleImages);
    useEffect(() => {
        setIndex(visibleImages);
    }, [visibleImages]);

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
<div className="relative w-full flex flex-col items-center pb-20 mt-[10vh] mb-[10vh] lg:mt-[20vh] lg:mb-[15vh]">

    <div className="flex items-center w-full justify-center p-15 mb-5">
        <h2 className="lg:text-[60px] text-[24px] sm:text-3xl md:text-4xl font-bold text-center text-[#3F8814]">
            The Canyoneering Experience
        </h2>
    </div>

    <div className="relative w-full flex items-center">

        {/* <button
            onClick={prevSlide}
            className="absolute left-0 z-10 bg-white shadow-md rounded-full w-10 h-10 cursor-pointer"
            >
            ◀
        </button> */}
        <div className="overflow-hidden w-full">
            <div
                onTransitionEnd={() => {
                    handleTransitionEnd();
                    enableTransition();
                    }}
                    className={`flex ${transition ? "transition-transform duration-500 ease-in-out" : ""}`}
                    style={{
                    // transform: `translateX(-${index * 25}%)`,
                    transform: `translateX(-${index * (100 / visibleImages)}%)`,
                    }}
                    >

                    {clonedSlides.map((img, i) => (
                    <div key={i} className="flex-shrink-0 p-1 sm:p-3 lg:p-6"
                        style={{ width: `${100 / visibleImages}%` }}
                    >

                        <div
                        className="relative w-full aspect-square cursor-pointer"
                        onClick={() => setLightboxIndex(i % galleryImages.length)}
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

        {/* <button
            onClick={nextSlide}
            className="absolute right-0 z-10 bg-white shadow-md rounded-full w-10 h-10 cursor-pointer"
            >
            ▶
        </button> */}

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