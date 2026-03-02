"use client";

import { ArrowRight } from "lucide-react";
import StarRating from "./StarRating";
import { useEffect, useState } from "react";
import ReviewStar from "./ReviewStar";

type Review = {
    id: number;
    name: string;
    comment: string;
    rating: number
    date: Date
};

const mockReviews: Review[] = [
    { id: 1, name: "Juan Dela Cruz", comment: "Absolutely amazing experience! The guides were professional and made us feel safe the whole time. The waterfalls and cliff jumps were unforgettable.", rating: 3, date: new Date("2026-02-27") },
    { id: 2, name: "Maria Santos", comment: "Very smooth booking process.", rating: 5, date: new Date("2026-02-27") },
    { id: 3, name: "Carlos Reyes", comment: "Customer support was helpful.", rating: 4, date: new Date("2026-02-27") },
    { id: 4, name: "Anna Lim", comment: "Will book again!", rating: 3, date: new Date("2026-02-27") },
    { id: 5, name: "Mark Tan", comment: "Well organized tour.", rating: 1, date: new Date("2026-02-27") },
    { id: 6, name: "Liza Gomez", comment: "Worth every peso.", rating: 2, date: new Date("2026-02-27") },
];

export default function Reviews() {
    const itemsPerPage = 4;
    const totalPages = Math.ceil(mockReviews.length / itemsPerPage);
    const [page, setPage] = useState(1);

    // Slice reviews for current page
    const start = (page - 1) * itemsPerPage;
    const visibleReviews = mockReviews.slice(start, start + itemsPerPage);

    // useEffect(() => {
    //     const fetchReviews = async () => {
    //     try {
    //         const res = await fetch("/api/reviews");
    //         const data = await res.json();
    //         setReviews(data);
    //     } catch (error) {
    //         console.error("Failed to fetch reviews:", error);
    //     }
    //     };

    // fetchReviews();
    // }, []);

 
    return(
        <div className="w-full flex flex-col h-[120vh] gap-[3%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%] pb-[5%]">
            <div>
                <p className="text-[#000000] text-[32px] font-poppins font-semibold">Reviews <span className="font-light text-[#4E4E4E]">(14 reviews)</span></p>
            </div>

            {/* rednder reviews here */}
            <div className="w-full h-full flex flex-col gap-4">

                {visibleReviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-2 p-[2%] h-[30%] w-full bg-[#F5FFE6] rounded-[15px]">
                    <div className="flex flex-row justify-between">
                        {/* Name & Date */}
                        <div>
                            <h3 className="font-semibold text-[#000000] font-poppins text-[20px]">{review.name}</h3>
                            <p className="font-poppins font-light text-[#000000] text-[13px]">{review.date.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}</p>
                        </div>
                        
                        {/* Stars */}
                        <div>
                            <ReviewStar rating={review.rating}/>
                        </div>
                    </div>
                    <p className="font-poppins font-regular text-[#000000] text-[16px]">{review.comment}</p>
                </div>
                ))}
            </div>

            {/* Pagination Buttons */}
            <div className="flex mt-auto justify-center items-center mt-4 space-x-1 h-[10%]">
                {/* Previous Button */}
                <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
                >
                &lt;
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${
                    p === page ? "bg-blue-500 text-white" : ""
                    }`}
                >
                    {p}
                </button>
                ))}

                {/* Next Button */}
                <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
                >
                &gt;
                </button>
            </div>
        </div>
    )
}