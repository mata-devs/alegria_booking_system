import { ArrowRight } from "lucide-react";
import StarRating from "./StarRating";

export default function Reviews() {
    return(
        <div className="w-full flex flex-col h-[50vh] gap-[3%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%] pb-[5%]">
            <div className="font-poppins font-semibold text-[#000000] text-[36px] pt-[1%] pb-[1%] ">
                Reviews
                <hr className="w-full border-t-3 border-[#9D9D9D]"/>
            </div>

            <div>
                <StarRating/>
            </div>

            <div className=" flex items-center justify-between w-full h-[6vh] border-[3px] border-[#9F9F9F] rounded-[15px] p-[2%] gap-[2%]">
                <input className="w-[85%]  outline-none text-[#373737] font-poppins font-medium"></input>
                    
                <button className="w-12 h-12 rounded-full bg-[#8BC34A] text-white flex items-center justify-center">
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    )
}