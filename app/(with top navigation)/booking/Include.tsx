import Image from "next/image";
export default function Include() {
    return(
        <div className="w-full flex flex-col border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%] pb-[5%] ">
            <h1 className="font-poppins font-semibold text-[#000000] text-[36px] pt-[1%] pb-[1%]">Include</h1>
            <h4 className="font-poppins font-regular text-[#000000] text-[20px] pt-[1%] pb-[1%]">Included in the price</h4>

            <div className="grid grid-cols-2 gap-[5%] mt-[5%]">
                <div className="flex flex-row items-start gap-[2%] font-poppins font-regular text-[#000000] text-[20px] pt-[1%] pb-[1%]">
                    <div className="relative w-[15%] h-8">
                        <Image
                        src="/check.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <div className="w-[85%]">Safety gear (helmet & life vest)</div>
                </div>

                <div className="flex flex-row items-start gap-[2%] font-poppins font-regular text-[#000000] text-[20px] pt-[1%] pb-[1%]">
                    <div className="relative w-[15%] h-8">
                        <Image
                        src="/check.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <div className="w-[85%]">Safety gear (helmet & life vest)</div>
                </div>

                <div className="flex flex-row items-start gap-[2%] font-poppins font-regular text-[#000000] text-[20px] pt-[1%] pb-[1%]">
                    <div className="relative w-[15%] h-8">
                        <Image
                        src="/check.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <div className="w-[85%]">Safety gear (helmet & life vest)</div>
                </div>

                <div className="flex flex-row items-start gap-[2%] font-poppins font-regular text-[#000000] text-[20px] pt-[1%] pb-[1%]">
                    <div className="relative w-[15%] h-8">
                        <Image
                        src="/check.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <div className="w-[85%]">Use of aqua shoes (subject to availability)</div>
                </div>

                <div className="flex flex-row items-start gap-[2%] font-poppins font-regular text-[#000000] text-[20px] pt-[1%] pb-[1%]">
                    <div className="relative w-[15%] h-8">
                        <Image
                        src="/check.png"
                        alt="star rating"
                        fill
                        className="object-contain"
                        />
                    </div>
                    <div className="w-[85%]">Safety gear (helmet & life vest)</div>
                </div>

            </div>
        </div>
    )
}