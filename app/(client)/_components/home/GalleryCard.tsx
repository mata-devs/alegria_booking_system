import Image from "next/image";

const GalleryCard = ({ image, alt, onClick }: { image: string; alt: string; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
    </div>
  );
}
export default GalleryCard;