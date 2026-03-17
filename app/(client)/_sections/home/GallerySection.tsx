"use client"

import { useState } from 'react';
import GalleryCard from '@/app/(client)/_components/home/GalleryCard';
import Lightbox from '@/app/(client)/_components/home/Lightbox';

export default function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages = [
    { id: 1, image: '/boulder_rocks.png', alt: 'Boulder rocks adventure 1' },
    { id: 2, image: '/boulder_rocks.png', alt: 'Boulder rocks adventure 2' },
    { id: 3, image: '/boulder_rocks.png', alt: 'Boulder rocks adventure 3' },
    { id: 4, image: '/boulder_rocks.png', alt: 'Boulder rocks adventure 4' },
    { id: 5, image: '/boulder_rocks.png', alt: 'Boulder rocks adventure 5' },
    { id: 6, image: '/boulder_rocks.png', alt: 'Boulder rocks adventure 6' },
  ];

  const handleNext = () => {
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return prev === galleryImages.length - 1 ? 0 : prev + 1;
    });
  };

  const handlePrev = () => {
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? galleryImages.length - 1 : prev - 1;
    });
  };

  return (
    <section className="w-full py-16 px-4 bg-[#f5f5dc]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-[#4a7c59] mb-12">
          Gallery
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {galleryImages.map((item, index) => (
            <GalleryCard
              key={item.id}
              image={item.image}
              alt={item.alt}
              onClick={() => setLightboxIndex(index)}
            />
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {[0, 1, 2, 3, 4].map((dot, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${index === 0 ? 'bg-[#4a7c59]' : 'bg-gray-300'
                }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <Lightbox
        images={galleryImages}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </section>
  );
}