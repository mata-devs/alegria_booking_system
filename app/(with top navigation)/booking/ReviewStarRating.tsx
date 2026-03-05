type StarRatingProps = {
    rating: number;
    setRating: (newRating: number) => void; // function to update rating
};

export default function ReviewStarRating({ rating, setRating }: StarRatingProps) {
    const safeRating = Math.min(Math.max(rating, 0), 5);

    return (
        <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => {
            const isFilled = i < safeRating;

            return (
            <span
                key={i}
                onClick={() => setRating(i + 1)}
                className={`text-3xl cursor-pointer ${
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