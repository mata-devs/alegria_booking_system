import Link from "next/link";

export default function CallToActionSection() {
    return (
        <div className="w-full h-[90vh] sm:h-[70vh] lg:h-[90vh] 
        lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.7),rgba(0,0,0,0)),url('/call-to-action-bg.png')] 
        lg:bg-[position:0%_55%]
        lg:bg-[size:140%]

        sm:bg-[linear-gradient(to_right,rgba(0,0,0,0.7),rgba(0,0,0,0)),url('/call-to-action-bg.png')] 
        sm:bg-[position:0%_55%]
        sm:bg-[size:155%]
        bg-no-repeat

        bg-[linear-gradient(to_bottom,rgba(0,0,0,0.7),rgba(0,0,0,0)),url('/call-to-action-bg.png')] 
        bg-[position:48%_25%]
        bg-[size:300%]
        ">

            <div className="flex flex-col w-full h-full  sm:w-[60%] h-full px-[5%] sm:px-[3%] lg:px-[5%] sm:pt-[15%] lg:pt-[10%] justify-between sm:justify-start ">
                <div className="w-full h-[55%] flex flex-col gap-6 lg:gap-8 justify-center sm:justify-start">
                    <div className=" w-full ">
                        <h1 className="font-poppins text-center sm:text-start font-bold text-[32px] sm:text-[32px] lg:text-[54px] text-[#FFFFFF]">Book Your Canyoneering Experience Now</h1>
                    </div>
                    <div className="w-full ">
                        <p className="font-poppins font-regular text-center sm:text-start text-[20px] sm:text-[20px] lg:text-[24px] text-[#FFFFFF]">
                            Jump, swim, and rappel through breathtaking waterfalls while guided by experienced professionals.
                        </p>
                    </div>
                </div>

                <div className="w-full h-[45%]  flex justify-center items-end sm:items-center pb-[15%]  ">
                    <Link  href="/booking">
                    <button className="font-poppins font-bold shadow-lg sm:text-[20px] lg:text-[24px] text-[#FFFFFF] bg-[#45A80A] px-[60px] py-[15px] rounded-[40px] cursor-pointer">Book Now</button>
                    </Link>
                </div>
            </div>
            
        </div>
    )
}