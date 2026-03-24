import Image from "next/image";

interface ServiceCard{
    title: string;
    img_path: string;
}

interface ServicesSectionCardsprops{
    serviceCards: ServiceCard[];
}

export default function ServicesSectionCards({serviceCards}: ServicesSectionCardsprops){
    return(
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-16">
            {serviceCards.map((card, index) =>(
                <div key={index} className="flex flex-col items-center">
                    <div className="relative aspect-[1/1] w-full rounded-[15px] overflow-hidden">
                        <Image
                            src={card.img_path}
                            alt={card.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <h2 className="text-[#3F8814] text-center font-poppins font-semibold text-[16px] sm:text-[20px] lg:text-2xl p-2">
                        {card.title}
                    </h2>
                </div>
            ))}
        </div>
    )
}