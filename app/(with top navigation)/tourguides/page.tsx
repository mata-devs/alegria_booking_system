import { GuideList } from "./GuideList";

export default function Tourguides() {
    return (
        <div className="flex flex-col items-center pl-[7%] pr-[7%] pb-[10%] justify-start bg-white min-h-screen">
            <div className="w-full h-[30vh] flex flex-col justify-center items-center ">
                <h1 className="font-poppins font-semibold text-[#3F8814] text-[54px]">
                    Meet our Tour Guides
                </h1>
            </div>

            <div>
                <GuideList />
            </div>

        </div>
    )
}