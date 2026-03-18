import Image from "next/image";
import ServicesSection from "./home/ServicesSection";
import Navbar from "@/app/(with top navigation)/components/Navbar";
import FloatingSectionDivider from "@/app/(with top navigation)/components/FloatingSectionDivider";
import GallerySection from "./home/GallerySection";
import Footer from "@/app/(with top navigation)/components/Footer";
import Landing from "./home/Landing";

export default function Home() {
  return (
    <div className="flex min-h-screen  items-center justify-center bg-zinc-50 font-sans flex-col">
      <Landing />
    </div>
  );
}
