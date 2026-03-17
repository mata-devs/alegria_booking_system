import Image from "next/image";
import ServicesSection from "@/app/(client)/_sections/home/ServicesSection";
import FloatingSectionDivider from "@/app/(client)/_components/home/FloatingSectionDivider";
import GallerySection from "@/app/(client)/_sections/home/GallerySection";

export default function Landing() {
  return (
    <div className="flex min-h-screen  items-center justify-center bg-zinc-50 font-sans flex-col">
      <div
        className="w-full h-[10%] z-50"
      >
      </div>
      {/* first section of hero page */}
      <div
        className="h-[90%] "
      >
        <Image
          className=""
          src="/alegria.png"
          alt="Alegria Background"
          width={1920}
          height={1080}
          priority
        />
      </div>

      <div
        className="hidden md:block w-full h-16"
      >
        <FloatingSectionDivider />
      </div>

      <ServicesSection />
      <GallerySection />

      {/* <Footer /> */}
    </div>
  );
}