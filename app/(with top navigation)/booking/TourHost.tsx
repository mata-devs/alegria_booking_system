import Image from "next/image";

export default function TourHost() {
    return(
        <div className="w-full flex flex-col h-[40vh] gap-[3%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%] pb-[5%]">
            <div className="flex justify-center bg-[#7CBBC2] w-[8vw] p-[5px] font-poppins font-medium text-[14px] rounded-[28px] text-[#007D99]">Specific Tour</div>
            
            <div className="flex h-[20%] items-center">
                <h1 className="font-poppins text-[#000000] text-[40px] pt-[1%] pb-[1%] ">Alegria Canyoneering Tour</h1>
            </div>

            {/* Rating & Location */}
            <div className="flex h-[12%] w-full gap-[5%]">
                <div className="flex flex-row items-center"> 
                    <div className="relative w-4 h-4">
                        <Image
                        src="/star.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <span className="font-poppins text-[16px] text-[#000000] font-medium">4.5 (117)</span>
                </div>
                <div className="flex flex-row items-center">
                    <div className="relative w-4 h-4">
                        <Image
                        src="/pin_location.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <span className="font-poppins text-[16px] text-[#000000] font-medium">Alegria, Cebu</span>
                </div>
            </div>

            <div className=" flex gap-[15px] items-center flex-row h-[25%] w-full ">
                <div className=" relative h-[100%] aspect-[1/1] rounded-full overflow-hidden">
                    <Image src="/profile.png" 
                    alt="host profile" 
                    fill
                    className="object-cover"/>
                </div>
                <div className="flex flex-row gap-[8px]">
                    <p className="font-poppins font-medium text-[16px] text-[#898989]">Hosted by</p> <p className="font-poppins font-bold text-[16px] text-[#000000]"> Juan Dela Cruz</p>
                </div>
            </div>

            <div>
                <hr className="w-full border-t-3 border-[#9D9D9D] my-4"/>
            </div>

            {/* Other Info*/}
            <div className="flex h-[12%] w-full gap-[10%]">
                <div className="flex flex-row items-center gap-[5%] w-[13%]"> 
                    <div className="relative w-6 h-6">
                        <Image
                        src="/clock_small.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <span className="font-poppins text-[16px] text-[#272727] font-medium">4.5 Hours</span>
                </div>

                <div className="flex flex-row items-center gap-[5%] w-[20%]">
                    <div className="relative w-6 h-6">
                        <Image
                        src="/people_small.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <span className="font-poppins text-[16px] text-[#272727] font-medium">Up to 100 people</span>
                </div>

                <div className="flex flex-row items-center gap-[5%] w-[20%]">
                    <div className="relative w-6 h-6">
                        <Image
                        src="/language_small.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <span className="font-poppins text-[16px] text-[#272727] font-medium">Alegria, Cebu</span>
                </div>
            </div>

        </div>
    )
}