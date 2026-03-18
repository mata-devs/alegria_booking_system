const fs = require('fs');
const path = require('path');

const files = [
  'app/(with top navigation)/booking/page.tsx',
  'app/(with top navigation)/booking/BookingSmall.tsx',
  'app/(with top navigation)/home/LandingCarousel.tsx',
  'app/(with top navigation)/home/LandingCarouselV2.tsx',
  'app/(with top navigation)/home/LandingGallery.tsx',
  'app/(with top navigation)/home/ReviewCarousel.tsx',
  'app/(with top navigation)/home/ReviewCarouselTest.tsx',
  'app/GallerySection.tsx',
  'app/(with top navigation)/home/CustomerReview.tsx',
  'app/(with top navigation)/home/FrequentQuestions.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace percentage-based utilities
    content = content.replace(/mb-\[5%\]/g, 'mb-12');
    content = content.replace(/mb-\[15vh\]/g, 'mb-32');
    content = content.replace(/mt-\[20vh\]/g, 'mt-40');
    content = content.replace(/mt-\[15vh\]/g, 'mt-32');
    content = content.replace(/mt-\[10%\]/g, 'mt-20');
    content = content.replace(/mt-\[7%\]/g, 'mt-16');
    content = content.replace(/gap-\[3%\]/g, 'gap-6');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');