import { GuideList } from "./GuideList";

export default function Tourguides() {
    return (
        <div className="flex flex-col items-center pl-[7%] pr-[7%] pb-[10%] justify-start bg-white min-h-screen">
            <div className="w-full h-[15vh] sm:h-[20vh] lg:h-[25vh] xl:h-[30vh] flex flex-col justify-center items-center ">
                <h1 className="font-poppins font-semibold text-[#3F8814] text-[1.5rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[3rem] xl:text-[3.5rem]">
                    Meet our Tour Guides
                </h1>
            </div>

            <div>
                <GuideList />
            </div>

        </div>
    )
}