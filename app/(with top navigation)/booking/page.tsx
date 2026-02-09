import Image from "next/image";
import ShowAllButton from "./ShowAllButton";
import BoookingSmall from "./BookingSmall";
import TourHost from "./TourHost";
import AvailableSlots from "./AvailableSlots";
import ExperiencesDescription from "./ExperiencesDescription";
import Include from "./Include";
import Availablity from "./Availability";
import Reviews from "./Reviews";


export default function Boooking() {
return (
    <div className="flex flex-col items-center pl-[7%] pr-[7%] justify-start bg-white min-h-screen">

        {/* Sections 1 Pic Gallery */}
        <div className="flex flex-row justify-center gap-[3%] pt-[3%] pb-[2%] w-full h-[100vh]">
            <div className="bg-blue-200 w-[70%] h-full relative aspect-square overflow-hidden rounded-lg group">
                <ShowAllButton />
                <Image src="/booking-pic-1.png"
                        alt="first picture"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="absolute"
                />
            </div>
            <div className="flex flex-col gap-[5%] justify-between w-[30%] h-full">
                <div className="bg-lime-50 w-[100 %] relative aspect-square overflow-hidden rounded-lg group">
                    <Image src="/booking-pic-1.png"
                            alt="first picture"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className=""
                        />
                </div>

                <div className="bg-lime-50 w-[100%] relative aspect-square overflow-hidden rounded-lg group">
                    <Image src="/booking-pic-1.png"
                            alt="first picture"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className=""
                        />
                </div>
                <div className="bg-lime-50 w-[100%] relative aspect-square overflow-hidden rounded-lg group">
                    <Image src="/booking-pic-1.png"
                            alt="first picture"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className=""
                        />
                </div>
            </div>   
        </div>
        
        {/* Sections 2 */}
        <div className="w-full flex flex-row-reverse pt-[3%]">
            {/* RIGHT */}
            <div className=" flex items-start w-[36%] justify-center items-center">
                <BoookingSmall/>
            </div>

            {/* LEFT */}
            <div className=" w-[65%] bg-pink-50 flex flex-col gap-[2%]">
                <TourHost/>
                <AvailableSlots/>
                <ExperiencesDescription/>
                <Include/>
                <Availablity/>
                <Reviews/>
            </div>
        </div>
    </div>
    );
}
