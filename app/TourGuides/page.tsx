"use client";

import React, { useState } from "react";
import { Star, MapPin, Phone, Mail, Award, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

// Tour Guide Card Component
const TourGuideCard = ({ 
    name, 
    rating, 
    reviews, 
    specialty, 
    image, 
    years, 
    tours 
}: { 
    name: string; 
    rating: number; 
    reviews: number; 
    specialty: string; 
    image: string; 
    years: number; 
    tours: number;
}) => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <div className="relative h-64 md:h-72 overflow-hidden bg-gray-100">
            <Image 
                src={image} 
                alt={name} 
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-xl mb-1">{name}</h3>
                <p className="text-white/90 text-sm font-medium">{specialty}</p>
            </div>
        </div>
        
        <div className="p-5 space-y-4">
            {/* Rating */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-black">{rating}</span>
                </div>
                <span className="text-gray-500 text-sm">({reviews} reviews)</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                    <Award className="w-4 h-4 text-[#74C00F]" />
                    <span>{years} years</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="w-4 h-4 text-[#74C00F]" />
                    <span>{tours}+ tours</span>
                </div>
            </div>

            {/* Action Button */}
            <button className="w-full bg-[#74C00F] hover:bg-[#62a30d] text-white font-semibold py-2.5 rounded-xl transition-colors">
                View Profile
            </button>
        </div>
    </div>
);

export default function TourGuidesPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const guidesPerPage = 6;

    // Sample tour guides data
    const tourGuides = [
        {
            id: 1,
            name: "Miguel Santos",
            rating: 4.9,
            reviews: 156,
            specialty: "Canyoneering Expert",
            image: "/alegria.png",
            years: 8,
            tours: 500
        },
        {
            id: 2,
            name: "Carlos Reyes",
            rating: 4.8,
            reviews: 142,
            specialty: "Adventure Guide",
            image: "/alegria.png",
            years: 6,
            tours: 420
        },
        {
            id: 3,
            name: "Juan dela Cruz",
            rating: 4.9,
            reviews: 198,
            specialty: "Senior Guide",
            image: "/alegria.png",
            years: 10,
            tours: 650
        },
        {
            id: 4,
            name: "Marco Villanueva",
            rating: 4.7,
            reviews: 89,
            specialty: "Canyoneering Specialist",
            image: "/alegria.png",
            years: 5,
            tours: 320
        },
        {
            id: 5,
            name: "Pedro Garcia",
            rating: 4.8,
            reviews: 167,
            specialty: "Expedition Leader",
            image: "/alegria.png",
            years: 9,
            tours: 580
        },
        {
            id: 6,
            name: "Ricardo Mendoza",
            rating: 4.9,
            reviews: 203,
            specialty: "Master Guide",
            image: "/alegria.png",
            years: 12,
            tours: 720
        },
        {
            id: 7,
            name: "Antonio Cruz",
            rating: 4.6,
            reviews: 97,
            specialty: "Adventure Specialist",
            image: "/alegria.png",
            years: 4,
            tours: 280
        },
        {
            id: 8,
            name: "Jose Fernandez",
            rating: 4.8,
            reviews: 145,
            specialty: "Canyoneering Pro",
            image: "/alegria.png",
            years: 7,
            tours: 490
        },
    ];

    const totalPages = Math.ceil(tourGuides.length / guidesPerPage);
    const startIndex = (currentPage - 1) * guidesPerPage;
    const currentGuides = tourGuides.slice(startIndex, startIndex + guidesPerPage);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-poppins">
            {/* Navbar */}
            <nav className="w-full bg-white px-6 md:px-12 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-[#74C00F] tracking-tight leading-none">Alegria</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">CANYONEERING</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="/" className="font-medium text-black hover:text-[#74C00F] transition">Home</a>
                    <a href="/TourGuides" className="font-medium text-[#74C00F]">Tour Guides</a>
                    <button className="bg-[#74C00F] text-white px-6 py-2 rounded-full font-medium hover:bg-[#62a30d] transition">
                        Book Now
                    </button>
                </div>
                {/* Mobile Menu Button */}
                <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Toggle menu">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {/* Hero Section */}
            <div className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-[#74C00F] to-[#5a9b0a] overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
                        Meet Our Guides
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl text-center font-medium">
                        Expert local guides ready to make your adventure unforgettable
                    </p>
                    <div className="flex items-center gap-6 mt-8 text-white/80">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            <span className="font-medium">Alegria, Cebu</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            <span className="font-medium">Licensed & Certified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-600 font-medium">
                            Showing {startIndex + 1}-{Math.min(startIndex + guidesPerPage, tourGuides.length)} of {tourGuides.length} guides
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <select aria-label="Filter by specialty" className="border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-gray-400 transition focus:outline-none focus:ring-2 focus:ring-[#74C00F]/20">
                            <option>All Specialties</option>
                            <option>Canyoneering Expert</option>
                            <option>Adventure Guide</option>
                            <option>Senior Guide</option>
                        </select>
                        <select aria-label="Sort guides" className="border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-gray-400 transition focus:outline-none focus:ring-2 focus:ring-[#74C00F]/20">
                            <option>Highest Rated</option>
                            <option>Most Reviews</option>
                            <option>Most Experienced</option>
                        </select>
                    </div>
                </div>

                {/* Guides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {currentGuides.map((guide) => (
                        <TourGuideCard key={guide.id} {...guide} />
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => goToPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx + 1}
                                onClick={() => goToPage(idx + 1)}
                                className={`w-10 h-10 rounded-lg font-semibold transition ${
                                    currentPage === idx + 1
                                        ? 'bg-[#74C00F] text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                )}

                {/* Contact Section */}
                <div className="mt-16 bg-white rounded-2xl p-8 md:p-10 border border-gray-200 shadow-sm">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                            Need Help Choosing a Guide?
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Our team is here to help you find the perfect guide for your adventure. Contact us for personalized recommendations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="tel:+639123456789" className="flex items-center gap-2 bg-[#74C00F] hover:bg-[#62a30d] text-white px-6 py-3 rounded-full font-semibold transition">
                                <Phone className="w-5 h-5" />
                                Call Us
                            </a>
                            <a href="mailto:info@alegriacanyoneering.com" className="flex items-center gap-2 bg-white hover:bg-gray-50 text-black border-2 border-gray-300 px-6 py-3 rounded-full font-semibold transition">
                                <Mail className="w-5 h-5" />
                                Email Us
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
