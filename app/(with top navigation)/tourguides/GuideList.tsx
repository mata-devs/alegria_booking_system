
import Image from "next/image";
interface TourGuides{
    id: number;
    name: string;
    image: string;
    quote: string;
}

export function GuideList() {

    const tourGuides: TourGuides[] = [
        { id: 1, name: "Juan Dela Cruz", image: "/tour_guide_1.png", quote: "Safety first, but adventure always!" },
        { id: 2, name: "Mark Anthony Reyes", image: "/tour_guide_1.png", quote: "The waterfalls are waiting — let's jump!" },
        { id: 3, name: "Carlos Mendoza", image: "/tour_guide_1.png", quote: "Trust the guide, enjoy the canyon." },
        { id: 4, name: "Rafael Santos", image: "/tour_guide_1.png", quote: "Every jump is optional, every view is worth it." },
        { id: 5, name: "Paolo Ramirez", image: "/tour_guide_1.png", quote: "Nature is our playground here in the canyon." },
        { id: 6, name: "Miguel Bautista", image: "/tour_guide_1.png", quote: "One step at a time, one waterfall at a time." },
        { id: 7, name: "Joshua Villanueva", image: "/tour_guide_1.png", quote: "Adventure begins where the trail ends." },
        { id: 8, name: "Daniel Navarro", image: "/tour_guide_1.png", quote: "Let's make your canyoneering trip unforgettable." },
        { id: 9, name: "Daniel Navarro", image: "/tour_guide_1.png", quote: "Let's make your canyoneering trip unforgettable." }
    ];

    return (
        <div className="w-full">

            {/* GRID */}
            <div className="grid grid-cols-2 gap-15">
                
                    {tourGuides.map((guide) => (
                        <div key={guide.id} className="flex flex-row w-[750px] h-[340px] bg-[#F5FFE6] rounded-[30px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                            <div className="flex justify-center items-center h-[100%] w-[30%] pl-[3%]">
                                <div className="w-[170px] h-[170px] rounded-full overflow-hidden">
                                    <Image
                                        src={guide.image}
                                        alt={guide.name}
                                        width={400}
                                        height={400}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col w-[70%] pl-[5%]">
                                <div className="flex items-center h-[40%] w-full">
                                    <p className="font-poppins font-bold text-[#000000] text-[36px]">{guide.name}</p>
                                </div>

                                <div className="flex h-[60%] w-full">
                                    <p className="font-poppins font-regular text-[#000000] text-[20px]">"{guide.quote}"</p>

                                </div>

                            </div>

                        </div>
                    ))}

            </div>
            
        </div>
    );
}