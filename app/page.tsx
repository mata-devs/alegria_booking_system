import Image from "next/image";
import ServicesSection from "./ServicesSection";
import Navbar from "@/components/Navbar";
import FloatingSectionDivider from "@/components/FloatingSectionDivider";
import GallerySection from "./GallerySection";
import Footer from "@/components/Footer";
import Landing from "./(with top navigation)/home/Landing";

export default function Home() {
  return (
    <div className="flex min-h-screen  items-center justify-center bg-zinc-50 font-sans flex-col">
      <Landing />
    </div>
  );
}
