"use client";

import { useState, useMemo } from "react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
import ReviewStar from "./ReviewStar";
import ReviewStarRating from "./ReviewStarRating";

type FormData = {
    name: string;
    email: string;
    address: string;
    rating: number;
    nationality: string;
    review: string;
};

export default function Reviews() {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [address, setAddress] = useState<string>("");

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        address: "",
        nationality: "",
        rating: 0,
        review: "",
    });

    const filteredCountries = useMemo(() => {
        return countries.all.filter((country) =>
            country.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
        if (!formData.name.trim()) return alert("Please enter your name.");
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return alert("Please enter a valid email address.");
        if (!formData.review.trim()) return alert("Please write a review.");
        if (formData.rating === 0) return alert("Please select a rating.");

        console.log("Form submitted:", formData);
        alert("Review submitted successfully!");

        // Reset form
        setFormData({
        name: "",
        email: "",
        address: "",
        nationality: "",
        rating: 0,
        review: "",
        });
    };

    return(
        <div className="w-full flex flex-col h-[115vh] gap-[3%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%]">
            <form
            onSubmit={handleSubmit}
            className="w-full h-full flex flex-col justify-between pb-[2%]"
            >
                <div>
                    <h2 className="font-poppins font-semibold text-[#000000] text-[32px] pt-[1%] pb-[1%]">Write a review</h2>
                </div>

                {/* Inputs */}
                <div className="flex flex-col gap-[2%] justify-center">
                    <div className="w-[60%]">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Name</p>
                        <input type="text" 
                            className="w-full h-[44px] border-[2px] border-[#9D9D9D] rounded-[15px] padding-[10px] font-poppins text-[#000000] pr-[2%] pl-[2%]"
                            maxLength={50}
                            value={formData.name}
                            onChange={(e) =>
                            setFormData({
                                ...formData,
                                name: e.target.value,
                            })
                            }
                        />
                    </div>

                    <div className="w-[60%]">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Email</p>
                        <input type="email" 
                            className="w-full h-[44px] border-[2px] border-[#9D9D9D] rounded-[15px] padding-[10px] font-poppins text-[#000000] pr-[2%] pl-[2%]" 
                            value={formData.email}
                            onChange={(e) =>
                            setFormData({
                                ...formData,
                                email: e.target.value,
                            })
                            }
                        />
                    </div>

                    <div className="w-[60%]">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Address</p>
                        <input type="text" 
                            className="w-full h-[44px] border-[2px] border-[#9D9D9D] rounded-[15px] padding-[10px] font-poppins text-[#000000] pr-[2%] pl-[2%]" 
                            value={formData.address}
                            onChange={(e) =>
                            setFormData({
                                ...formData,
                                address: e.target.value,
                            })
                            }
                        />
                    </div>
                    

                    {/* Nationality Dropdown */}
                    <div className="relative w-[40%] select-none">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Nationality</p>

                        {/* Selected Field */}
                        <div
                            className="border p-2 rounded cursor-pointer flex items-center justify-between border-[2px] h-10 border-[#9D9D9D] rounded-[15px] padding-[10px] font-poppins text-[#000000] pr-[2%] pl-[2%]"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {formData.nationality ? (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8">
                                    <CircleFlag
                                    countryCode={formData.nationality.toLowerCase()}
                                    height={20}
                                    />
                                </div>
                                <span className="font-poppins font-regular text-[#7C7C7C]">{
                                countries.all.find(
                                    (c) => c.alpha2 === formData.nationality
                                )?.name
                                }
                                </span>
                            </div>
                            ) : (
                            <span className="font-poppins font-regular text-[#7C7C7C]">Select nationality</span>
                            )}
                        </div>

                        {/* Dropdown Panel */}
                        {isOpen && (
                            <div className="absolute mt-2 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-50">
                            
                            {/* Search Input */}
                            <div className="p-2">
                            <input
                                type="text"
                                placeholder="Search country..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full p-2 border-[1px] border-[#9D9D9D] rounded-[10px] font-poppins text-[#7C7C7C]"
                            />
                            </div>

                            {/* Country List */}
                            {filteredCountries.map((country) => (
                                <div
                                // key={country.alpha2}
                                key={`${country.alpha2}-${country.name}`}
                                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer h-[60px]"
                                onClick={() => {
                                    setFormData((prev) => ({
                                    ...prev,
                                    nationality: country.alpha2,
                                    }));
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                >
                                    <div className="w-8 h-8">
                                        <CircleFlag
                                            countryCode={country.alpha2.toLowerCase()}
                                            height={10}
                                        />
                                    </div>
                                    <span className="font-poppins font-regular text-[#7C7C7C]">{country.name}</span>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>

                    {/* STAR RATING */}
                    <div>
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Rating</p>
                        {/* <ReviewStarRating rating={formData.rating} /> */}
                        {/* <ReviewStarRating rating={formData.rating} setRating={(newRating) =>
                            setFormData((prev) => ({ ...prev, rating: newRating }) /> */}
                        <ReviewStarRating
                            rating={formData.rating}
                            setRating={(newRating: number) =>
                                setFormData((prev) => ({ ...prev, rating: newRating }))
                            }
                            />

                    </div>

                    {/* REVIEW ---------------------------------REVIEW------------------------------------REVIEW*/}
                    <div className="flex flex-col w-full min-h-[40%]">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Review</p>
                        <textarea 
                            className="w-full h-[30vh] border-[2px] border-[#9D9D9D] rounded-[15px]  font-poppins text-[#000000] p-5"
                            maxLength={500}
                            value={formData.review}
                            onChange={(e) =>{
                                const value = e.target.value;

                                const sanitized = value.replace(/[^a-zA-Z0-9 .,!?'-]/g, "");

                                setFormData((prev) => ({
                                    ...prev,
                                    review: sanitized,
                                }));
                            //     const value = e.target.value;

                            //     // Allow letters, numbers, spaces, and basic punctuation
                            //     const sanitized = value.replace(/[^a-zA-Z0-9 .,!?'-]/g, "");

                            //     setFormData({
                            //         ...formData,
                            //         review: e.target.value,
                            // })
                            }}
                        />
                    </div>
                </div>
                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-32 bg-[#7BCA0D] text-white p-2 rounded-[15px] mt-4 font-semibold font-poppins text-[20px] hover:bg-[#66AE00] transition"
                >
                    Submit
                </button>
            </form>   
        </div>
    )
}