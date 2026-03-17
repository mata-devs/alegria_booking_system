import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const Lightbox = ({ images, currentIndex, onClose, onNext, onPrev }: { images: { image: string; alt: string }[]; currentIndex: number | null; onClose: () => void; onNext: () => void; onPrev: () => void }) => {
  if (currentIndex === null) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Close lightbox"
      >
        <X size={32} />
      </button>
      
      <button
        onClick={onPrev}
        className="absolute left-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft size={40} />
      </button>
      
      <div className="relative max-w-5xl max-h-[80vh] w-full h-full">
        <Image
          src={images[currentIndex].image}
          alt={images[currentIndex].alt}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>
      
      <button
        onClick={onNext}
        className="absolute right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Next image"
      >
        <ChevronRight size={40} />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

export default Lightbox;