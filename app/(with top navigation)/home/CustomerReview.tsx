export default function CustomerReview() {
    return(
        <div className="flex flex-col w-full min-h-[80vh] gap-[3%] mt-[15vh] ">
            <div className="w-full flex flex-col justify-center items-center pr-[20%] pl-[20%]">
                <p className="font-poppins font-bold text-[#3F8814] text-[50px] text-center">
                    What our happy customers are saying Canyoneering in Alegria
                </p>
            </div>


            <div className="w-full flex justify-center">
                <div className="w-1/2 flex-shrink-0 p-6 flex justify-center">
                {/* CARD */}
                <div className="w-[650px] h-[300px] p-4 bg-[#F5FFE6] rounded-[30px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                    {/* Upper */}
                    <div className="w-full h-[30%] flex flex-row items-center justify-between">
                        <div className="flex flex-row w-[60%] items-center gap-5 pl-4">
                            <div className="flex aspect-[1/1] w-15 h-15 bg-[#F3C3B5] rounded-full justify-center items-center">
                            </div>

                            <div >
                                <p className="font-poppins font-semibold text-[#000000] text-[24px]">
                                    Juan Dela Cruz
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-row w-[20%] item-center justify-end pr-4">
                            <span className="text-[#F0A822] text-4xl">★</span>
                            <span className="text-[#898989] text-[24px]">4/5</span> 
                        </div>
                        
                    </div>

                    {/* Lower */}
                    <div className="flex w-full h-[70%] pl-4 pr-4 pt-2">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
                            aliquip ex ea commodo consequat. </p>
                    </div>
                    
                </div>
                </div>

                <div className="w-1/2 flex-shrink-0 p-6 flex justify-center">
                {/* CARD */}
                <div className="w-[650px] h-[300px] p-4 bg-[#F5FFE6] rounded-[30px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                    {/* Upper */}
                    <div className="w-full h-[30%] flex flex-row items-center justify-between">
                        <div className="flex flex-row w-[60%] items-center gap-5 pl-4">
                            <div className="flex aspect-[1/1] w-15 h-15 bg-[#F3C3B5] rounded-full justify-center items-center">
                            </div>

                            <div >
                                <p className="font-poppins font-semibold text-[#000000] text-[24px]">
                                    Juan Dela Cruz
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-row w-[20%] item-center justify-end pr-4">
                            <span className="text-[#F0A822] text-4xl">★</span>
                            <span className="text-[#898989] text-[24px]">4/5</span> 
                        </div>
                        
                    </div>

                    {/* Lower */}
                    <div className="flex w-full h-[70%] pl-4 pr-4 pt-2">
                        <p className="font-poppins font-regular text-[#000000] text-[20px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
                            aliquip ex ea commodo consequat. </p>
                    </div>
                    
                </div>
                </div>
            </div>
        </div>
    )
}