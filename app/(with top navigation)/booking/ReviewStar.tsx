type StarRatingProps = {
    rating: number;
};

export default function ReviewStar({ rating }: StarRatingProps) {
    const safeRating = Math.min(Math.max(rating, 0), 5);

    return (
        <div className="flex">
        {Array.from({ length: 5 }, (_, i) => {
            const isFilled = i < safeRating;

            return (
            <span
                key={i}
                className={`text-2xl ${
                isFilled ? "text-[#F0A822]" : "text-gray-300"
                }`}
            >
                ★
            </span>
            );
        })}
        </div>
    );
}