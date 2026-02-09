"use client";

import { useState } from "react";

type StarRatingProps = { max?: number;
    value?: number;
    onChange?: (value: number) => void;
};

export default function StarRating({
        max = 5,
        value = 0,
        onChange,
    }: StarRatingProps) {
        const [rating, setRating] = useState(value);
        const [hover, setHover] = useState(0);

        const handleClick = (star: number) => {
            setRating(star);
            onChange?.(star);
    };

    return (
        <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => {
            const star = i + 1;
            const isActive = star <= (hover || rating);

        return (
            <button
                key={star}
                type="button"
                onClick={() => handleClick(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="cursor-pointer text-2xl focus:outline-none text-[46px]"
            >
            <span className={isActive ? "text-yellow-400" : "text-gray-300 " }>
                ★
            </span>
            </button>
            );
        })}
    </div>
    );
}