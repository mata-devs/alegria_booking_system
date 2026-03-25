"use client";

import { useState, useEffect } from "react";
import { CircleFlag } from "react-circle-flags";

interface Review {
    id: number;
    name: string;
    nationality: string;
    rating: string;
    review: string;
}

export default function ReviewCarousel() {
    const reviews: Review[] = [
        { id: 1, name: "Juan Delgado", nationality: "AD", rating: "4", review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
        { id: 2, name: "Maria Santos", nationality: "PH", rating: "5", review: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
        { id: 3, name: "John Smith", nationality: "US", rating: "4", review: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
        { id: 4, name: "Anna Lee", nationality: "KR", rating: "5", review: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
        { id: 5, name: "Carlos Ruiz", nationality: "ES", rating: "4", review: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium." },
        { id: 6, name: "Li Wei", nationality: "CN", rating: "5", review: "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo." },
    ];

    

    const [cardsPerView, setCardsPerView] = useState(2);

    useEffect(() => {
        const updateView = () => {
            if (window.innerWidth < 640) {
                setCardsPerView(1); // mobile
            } else if (window.innerWidth < 1024) {
                setCardsPerView(2); // tablet (you can change to 2 if you want)
            } else {
                setCardsPerView(2); // desktop
            }
        };

        updateView();
        window.addEventListener("resize", updateView);

        return () => window.removeEventListener("resize", updateView);
    }, []);

    // const visible = 2;
    const visible = cardsPerView;

    // Clone slides for infinite loop
    const clonedSlides: Review[] = [
        ...reviews.slice(-visible),
        ...reviews,
        ...reviews.slice(0, visible),
    ];

    const [index, setIndex] = useState(visible);
    const [transition, setTransition] = useState(true);

    const nextSlide = () => setIndex((prev) => prev + 1);
    const prevSlide = () => setIndex((prev) => prev - 1);

    // const handleTransitionEnd = () => {
    //     // loop to start/end
    //     if (index >= reviews.length + visible) {
    //     setTransition(false);
    //     setIndex(visible);
    //     }
    //     if (index <= visible - 1) {
    //     setTransition(false);
    //     setIndex(reviews.length + visible - 1);
    //     }
    // };

    // useEffect(() => {
    //     if (!transition) {
    //     requestAnimationFrame(() => setTransition(true));
    //     }
    // }, [transition]);
    const handleTransitionEnd = () => {
        if (index === reviews.length + visible) {
            setTransition(false);
            setIndex(visible);
        }

        // reached left clone
        if (index === visible - 1) {
            setTransition(false);
            setIndex(reviews.length + visible - 1);
        }
    
    };

    const enableTransition = () => {
        if (!transition) {
            setTimeout(() => setTransition(true), 50);
        }
    };
    
    // Re-enable transition immediately
    useEffect(() => {
    if (!transition) {
        requestAnimationFrame(() => setTransition(true));
    }
    }, [transition]);
    // useEffect(() => {
    // if (!transition) {
    //     // Use setTimeout 0 instead of requestAnimationFrame
    //     setTimeout(() => setTransition(true), 0);
    // }
    // }, [transition]);

    // Autoplay with tab pause
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

    return (
        <div className="relative w-full flex flex-col gap-5 sm:gap-10 lg:gap-30 items-center mt-[15vh] lg:mt-[20vh] lg:mb-[15vh]">
            <div className=" flex flex-row px-[10%] lg:px-[10%] w-full">
                <h2 className="lg:text-[60px] text-[20px] sm:text-[32px] font-bold text-center text-[#3F8814] mb-10">
                    What our happy customers are saying about Canyoneering in Alegria
                </h2>
            </div>

            <div className="relative w-[100vw] flex">
                {/* Slider */}
                <div className="overflow-hidden w-full h-[40vh] lg:h-[50vh]">
                    <div
                        onTransitionEnd={() => {
                            handleTransitionEnd();
                            enableTransition();
                            }}
                        className={`flex ${transition ? "transition-transform duration-500 ease-in-out" : ""}`}
                        style={{
                        // transform: `translateX(-${index * 50}%)`, // slide 50% per card
                        transform: `translateX(-${index * (100 / cardsPerView)}%)`,
                        }}
                    >
                        {clonedSlides.map((review, i) => (
                        <div
                            key={`${review.id}-${i}`}
                            //className="flex-shrink-0 px-40" // horizontal padding for spacing
                            className="flex-shrink-0 px-[8%] sm:px-[2%] lg:px-[4%] xl:px-[8%]"
                            //style={{ flex: "0 0 calc(50%)" }} // 50% width minus half padding
                            style={{ flex: `0 0 ${100 / cardsPerView}%` }}
                        >
                            {/* THE CARD */}
                            <div className="h-[220px] lg:h-[300px] bg-[#F5FFE6] rounded-[15px] lg:rounded-[30px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] pb-4 px-4 pt-5 lg:pb-6 lg:px-8 lg:pt-10 flex flex-col">
                            {/* Upper */}
                                <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                        <CircleFlag countryCode={review.nationality.toLowerCase()} className="w-10 h-10 lg:w-15 lg:h-15" />
                                        <p className="font-poppins font-semibold text-[16px] lg:text-[24px] text-[#000000]">{review.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        <span className="text-[#F0A822] font-poppins text-4xl">★</span>
                                        <span className="text-[#898989] font-poppins font-semibold text-[12px] lg:text-[20px]">{review.rating}/5</span>
                                        </div>
                                </div>
                                    {/* Lower */}
                                    <div className="flex w-full h-[60%] lg:h-[70%] px-2 pt-5 lg:px-4 lg:pt-8">
                                        <p className="lg:mt-4 font-poppins font-regular text-[15px] lg:text-[20px] text-[#000000] line-clamp-4">"{review.review}"</p>
                                    </div>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}