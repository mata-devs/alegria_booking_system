import ServicesSectionCards from "@/components/ServicesSectionCards"


export default function ServicesSection(){
    const serviceCards = [
        { title: "Wild Adventure", img_path: "/wild_adventure.png"},
        { title: "Cliff Jumping", img_path: "/cliff_jumping.png"},
        { title: "Turquoise Waters", img_path: "/turqoise_waters.png"},
        { title: "Extreme and Exciting", img_path: "/extreme_and_exciting.png"},
        { title: "Breathtaking Waterfalls", img_path: "/breathtaking_waterfalls.png"},
        { title: "Water Slides", img_path: "/water_slides.png"},
        { title: "Boulder Rocks", img_path: "/boulder_rocks.png"},
        { title: "Stunning Scenery", img_path: "/stunning_scenery.png"},

    ]

    return (
        <div
            className="flex flex-col gap-5 min-h-max items-center mt-5 md:mt-10 justify-center font-poppins p-4"
        >
            <div className="flex flex-col justify-center items-center h-auto w-full sm:w-[80%] md:w-[70%] lg:w-[50%] mb-6 md:mb-8">
                <h1
                    className="text-[#75C308] font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center"
                >
                    Alegria, Cebu
                </h1>
                {/* hidden div */}
                <h2
                    className="text-[#535353] font-medium text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center"
                >
                    Canyoneering
                </h2>

                {/* <div className="h-5"></div> */}
            </div>

            <div className="flex flex-col justify-center items-center h-auto w-full sm:w-[80%] md:w-[70%] md:mt-16  mb-8 md:mb-12">
                <h1
                    className="text-[#3F8814] font-extrabold text-2xl sm:text-3xl md:text-4xl text-center px-4"
                >
                    What you’ll expect and experience during this activity
                </h1>
            </div>

            <div className="w-full ">
                <ServicesSectionCards
                    serviceCards={serviceCards}
                />
            </div>
        </div>
    )
}