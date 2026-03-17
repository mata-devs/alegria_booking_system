import Image from "next/image";
import ShowAllButton from "./ShowAllButton";
import BoookingSmall from "./BookingSmall";
import TourHost from "./TourHost";
import AvailableSlots from "./AvailableSlots";
import ExperiencesDescription from "./ExperiencesDescription";
import Include from "./Include";
import Availablity from "./Availability";
import Reviews from "./Reviews";
import ReviewsTest from "./ReviewTest";
import ReviewForm from "./ReviewForm";
import Footer from "@/components/Footer";
import { Book } from "lucide-react";
import BookingGallery from "./BookingGallery";


// interface BookingPageProps {
//     searchParams: {
//         date?: string;
//         time?: string;
//         guests?: string;
//     };
// }

export default function Boooking() {
return (
    <div className="flex flex-col items-center pl-[7%] pr-[7%] justify-start bg-white min-h-screen">

        {/* Sections 1 Pic Gallery */}
        <div className="flex flex-row justify-center gap-[3%] pt-[3%] pb-[2%] w-full h-[100vh] mb-[5%]">
            <BookingGallery/>   
        </div>
        
        {/* Sections 2 */}
        <div className="w-full flex flex-row-reverse pt-[3%]">
            {/* RIGHT */}
            <div className=" flex items-start w-[36%] justify-center items-center">
                <BoookingSmall/>
            </div>

            {/* LEFT */}
            <div className=" w-[65%] bg-pink-50 flex flex-col gap-[2%] mb-[5%]">
                <TourHost/>
                <AvailableSlots/>
                <ExperiencesDescription/>
                <Include/>
                <Reviews/>
                <ReviewForm/>
            </div>
        </div>
        
    </div>
    
    );
}
