import BookingPayInfo from "./BookingPayInfo";

export default function BookingForms() {


    return (
            <div className="w-[90%] h-[90vh] border-[3px] border-[#B90000] flex flex-col ">

                {/* BOOKING FORMS */}
                <div className="flex flex-row justify-between h-[90%] pt-[1%] pb[1%]">
                    <div className="w-[55%] h-full border-[2px] border-[#000000]">
                        <h1 className="text-[#BEBEBE]">Forms</h1>
                    </div>

                    <div className="w-[35%] h-full border-[2px] border-[#000000]">
                        <BookingPayInfo/>
                    </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-row justify-between h-[10%] w-full items-center">
                    <button className="h-[62px] w-[170px] font-poppins font-bold text-[18px] bg-[#000000] text-[#FFFFFF] rounded-[20px]">
                        Go Back
                    </button>

                    <button className="h-[62px] w-[170px] font-poppins font-bold text-[18px] bg-[#7BCA0D] text-[#FFFFFF] rounded-[20px]">
                        Confirm
                    </button>

                </div>
            </div>
        
    )
}