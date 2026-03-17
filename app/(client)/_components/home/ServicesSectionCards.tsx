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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-16">
            {serviceCards.map((card, index) =>(
                <div key={index} className="flex flex-col items-center">
                    <Image
                        src={card.img_path}
                        alt={card.title}
                        width={300}
                        height={300}
                    />
                    <h2 className="text-[#3F8814] font-poppins font-semibold text-2xl p-2">
                        {card.title}
                    </h2>
                </div>
            ))}
        </div>
    )
}