import Image from "next/image";

export default function ShowAllButton() {
    return(
        <button className="h-[40px] w-[178px] rounded-[12px] font-poppins font-medium text-[15px] text-[#616161] cursor-pointer gap-3 z-10 absolute bg-white flex flex-row bottom-3 left-5 items-center justify-center">
            <Image src="/images_icon.png" alt="arrow" width={20} height={20}/>
            Show All Images
        </button>
    )
}