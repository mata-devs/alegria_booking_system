export default function BoookingSmall() {
    return(
        <div className="
        flex flex-col gap-[5%] aspect-[10/13] w-[23vw] shadow-[0_4px_20px_rgba(0,0,0,0.25)] bg-white p-4 rounded rounded-[12px] pt-[5%] pr-[6%] pl-[6%]">
            
            <div className="
            flex 
            flex-row 
            justify-between 
            align-center 
            w-full 
            h-[6%]">
                <div className="flex flex row font-poppins font-semibold text-[24px] text-[#000000] h-[100%]">₱205/<p className="font-poppinns font-medium text-[20px] self-end">Person</p></div>
                <div className="font-poppins font-medium text-[16px] text-[#000000] h-[100%]">rating</div>
            </div>

            {/* Time & Guests */}
            <div className="flex flex-col mt-[7%] w-full border-[3px] border-[#9F9F9F] h-[30%] rounded-[30px]">

                {/* Date & Time */}
                <div className=" flex flex-row justify-between items-center w-full h-[50%] border-b-[2px] border-[#9F9F9F] pr-[5%] pl-[5%]">
                    <div className="">date picker</div>
                    <div>time picker</div>
                </div>

                {/* Guests */}
                <div className="w-full h-[50%]">
                    
                </div>

            </div>

            {/* Promo Code */}
            <div className=" h-[25%] flex flex-col gap-[5%]">
                <h3 className="font-poppins font-bold text-[20px] text-[#000000]">Promo Code</h3>
                <h4 className="font-poppins font-regular text-[15px] text-[#BEBEBE]"> Enter you promo code here (optional)</h4>

                {/* Input */}
                <div className=" flex items-center justify-evenly w-full h-[40%] border-[3px] border-[#9F9F9F] rounded-[15px] p-[2%] gap-[2%]">
                    <input className="w-[85%] h-[85%] outline-none text-[#373737] font-poppins font-medium"></input>
                    <button className="w-[15%] h-[85%] cursor-pointer font-poppins font-bold text-[15px] text-[#178893]">Apply</button>
                </div>
            </div>

            {/* Breakdown */}
            <div className=" flex flex-col gap-[2%] h-[20%]">
                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">test</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">test</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">test</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">test</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">test</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">test</div>
                </div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">test</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">test</div>
                </div>

                <div className="w-full h-[3px] bg-[#9F9F9F]">"""</div>

                <div className="w-full flex justify-between">
                    <div className="w-[70%] text-[#000000] font-poppins font-semibold">Total</div>
                    <div className="w-[30%] text-[#000000] font-poppins font-semibold flex justify-end">123456</div>
                </div>
                
            </div>

            {/* Button */}
            <div className="w-full flex justify-center h-[20%] mt-[10%]"> 
                <button className="bg-[#7BCA0D] w-[90%] h-[50%] rounded-[30px] text-[#FFFFFF] font-poppins font-medium text-[24px] cursor-pointer">Reserve</button>
            </div>

            
        </div>
    )
}