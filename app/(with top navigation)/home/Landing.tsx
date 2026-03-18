import Image from "next/image";
import ServicesSection from "./ServicesSection";
import Navbar from "@/app/(with top navigation)/components/Navbar";
import FloatingSectionDivider from "@/app/(with top navigation)/components/FloatingSectionDivider";
import GallerySection from "./GallerySection";
import Footer from "@/app/(with top navigation)/components/Footer";
import LandingGallery from "./LandingGallery";
import FrequentQuestions from "./FrequentQuestions";
import CustomerReview from "./CustomerReview";
import LandingCarousel from "./LandingCarousel";
import LandingCarouselV2 from "./LandingCarouselV2";
import ReviewCarousel from "./ReviewCarousel";

export default function Landing() {
  return (
    <div className="flex min-h-screen  items-center justify-center bg-zinc-50 font-sans flex-col">
      <div
        className="w-full h-[90%] z-50"
      >
      </div>
      {/* first section of hero page */}
        <div
          className="h-full w-full "
        >
          {/* <Image
              className=""
              src="/alegria.png"
              alt="Alegria Background"
              width={1920}
              height={1080}
              priority
            /> */}
            <div className="w-full h-full aspect-video">
              <iframe
                className="w-full h-[81%] border-0"
                src="https://www.mata.ph/cebu/alegria/"
                title="Alegria Virtual Tour"
                
              />
            </div>
        </div>

      <div
        className="hidden md:block w-full h-16"
      >
        <FloatingSectionDivider />
      </div>
      <div className="flex flex-col w-full">
        <ServicesSection />
        {/* <LandingGallery /> */}
        <LandingCarousel/>
        {/* <LandingCarouselV2/> */}
        <FrequentQuestions/>
        {/* <CustomerReview/> */}
        <ReviewCarousel/> 
      </div>

    </div>
  );
}