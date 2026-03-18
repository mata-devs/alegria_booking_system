"use client";

import { ArrowRight } from "lucide-react";
import StarRating from "./StarRating";
import { useEffect, useState } from "react";
import ReviewStar from "./ReviewStar";
import { CircleFlag } from "react-circle-flags";

type Review = {
    id: number;
    name: string;
    nationality: string;
    comment: string;
    rating: number
    date: Date
};

const mockReviews: Review[] = [
{ id: 1, name: "Juan Dela Cruz", nationality: "PH", comment: "Absolutely amazing experience! The guides were professional and made us feel safe the whole time.", rating: 5, date: new Date("2026-02-27") },
{ id: 2, name: "Maria Santos", nationality: "PH", comment: "Very smooth booking process and the tour was well organized.", rating: 5, date: new Date("2026-02-25") },
{ id: 3, name: "Carlos Reyes", nationality: "ES", comment: "Customer support was helpful when we had questions before booking.", rating: 4, date: new Date("2026-02-24") },
{ id: 4, name: "Anna Lim", nationality: "SG", comment: "Will definitely book again next time we visit Cebu.", rating: 4, date: new Date("2026-02-23") },
{ id: 5, name: "Mark Tan", nationality: "SG", comment: "Well organized tour and friendly guides.", rating: 4, date: new Date("2026-02-22") },
{ id: 6, name: "Liza Gomez", nationality: "PH", comment: "Worth every peso! The waterfalls were beautiful.", rating: 5, date: new Date("2026-02-21") },
{ id: 7, name: "Daniel Schmidt", nationality: "DE", comment: "Great adventure and stunning scenery. Highly recommended.", rating: 5, date: new Date("2026-02-20") },
{ id: 8, name: "Emily Johnson", nationality: "US", comment: "One of the best experiences during our Philippines trip.", rating: 5, date: new Date("2026-02-19") },
{ id: 9, name: "Tom Wilson", nationality: "GB", comment: "Fun activity but prepare for lots of walking and climbing.", rating: 4, date: new Date("2026-02-18") },
{ id: 10, name: "Hiroshi Tanaka", nationality: "JP", comment: "Very professional guides and good safety briefing.", rating: 5, date: new Date("2026-02-17") },
{ id: 11, name: "Claire Dubois", nationality: "FR", comment: "Beautiful canyon and waterfalls. The jumps were exciting!", rating: 5, date: new Date("2026-02-16") },
{ id: 12, name: "Lucas Oliveira", nationality: "BR", comment: "Amazing adventure with great views.", rating: 5, date: new Date("2026-02-15") },
{ id: 13, name: "Sophia Rossi", nationality: "IT", comment: "The guides were very friendly and helpful.", rating: 4, date: new Date("2026-02-14") },
{ id: 14, name: "Noah Kim", nationality: "KR", comment: "Good experience overall. Would recommend to friends.", rating: 4, date: new Date("2026-02-13") },
{ id: 15, name: "Olivia Chen", nationality: "CN", comment: "The waterfalls were stunning and the water was refreshing.", rating: 5, date: new Date("2026-02-12") },
{ id: 16, name: "Ethan Walker", nationality: "AU", comment: "Perfect activity for adventure lovers.", rating: 5, date: new Date("2026-02-11") },
{ id: 17, name: "Isabella Garcia", nationality: "MX", comment: "Super fun day with amazing views.", rating: 5, date: new Date("2026-02-10") },
{ id: 18, name: "Liam O'Connor", nationality: "IE", comment: "The cliff jumps were thrilling!", rating: 4, date: new Date("2026-02-09") },
{ id: 19, name: "Ava Müller", nationality: "DE", comment: "Very well organized and safe.", rating: 4, date: new Date("2026-02-08") },
{ id: 20, name: "Mateo Silva", nationality: "BR", comment: "A must-do adventure when visiting Cebu.", rating: 5, date: new Date("2026-02-07") },
];

export default function Reviews() {
    const itemsPerPage = 4;
    const totalPages = Math.ceil(mockReviews.length / itemsPerPage);
    const [page, setPage] = useState(1);

    const maxPagesToShow = 4;

    const startPage = Math.max(page - maxPagesToShow, 1);
    const endPage = Math.min(page + maxPagesToShow, totalPages);

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
        <div className="w-full flex flex-col h-[120vh] gap-[4%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%]">
            <div>
                <p className="text-[#000000] text-[32px] font-poppins font-semibold">Reviews <span className="font-light text-[#4E4E4E]">({mockReviews.length} reviews)</span></p>
            </div>

            {/* rednder reviews here */}
            <div className="w-full h-full flex flex-col gap-4">

                {visibleReviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-2 p-[2%] pr-[4%] pl-[4%] h-[23%] w-full bg-[#F5FFE6] rounded-[15px]">
                    <div className="flex flex-row justify-between">
                        {/* Name & Date */}
                        <div className="flex flex-row gap-5">
                            <div className="flex aspect-[1/1] w-14 justify-center items-center">
                                {/* <p className="font-poppins font-medium text-[#FFFFFF] text-[36px]">{review.name[0]}</p> */}
                                <CircleFlag countryCode={review.nationality.toLowerCase()} className="w-15 h-15" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#000000] font-poppins text-[20px]">{review.name}</h3>
                                <p className="font-poppins font-light text-[#000000] text-[13px]">{review.date.toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}</p>
                            </div>
                        </div>
                        
                        {/* Stars */}
                        <div>
                            <ReviewStar rating={review.rating}/>
                        </div>
                    </div>
                    <p className="font-poppins font-regular text-[#000000] text-[16px]">"{review.comment}"</p>
                </div>
                ))}
            </div>

            {/* Pagination Buttons */}
            <div className="flex mt-auto justify-center items-center mt-4 space-x-1 h-[5%]">
                {/* Previous Button */}
                <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 font-semibold font-poppins text-[30px] border-0 cursor-pointer text-[#7BCA0D]"
                >
                &lt;
                </button>

                {/* Page Numbers */}
                {/* {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => ( */}
                {Array.from(
                { length: endPage - startPage + 1 },
                (_, i) => startPage + i
                ).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 border rounded ${
                        p === page ? "bg-[#7BCA0D] text-white rounded-full font-semibold font-poppins" : " text-[#7BCA0D] border-0 font-semibold font-poppins"
                        }`}
                    >
                        {p}
                    </button>
                ))}

                {/* Next Button */}
                <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 text-[#7BCA0D] font-semibold font-poppins text-[30px] border-0 cursor-pointer"
                >
                &gt;
                </button>
            </div>
        </div>
    )
}