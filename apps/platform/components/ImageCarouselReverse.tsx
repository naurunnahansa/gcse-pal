"use client";

import Image from "next/image";

const ImageCarouselReverse = () => {
  const images = [
    "/assets/Frame 3.png",
    "/assets/Frame 1.png",
    "/assets/Frame 4.png",
  ];

  return (
    <div className="relative w-full h-[250px] overflow-hidden">
      <div
        className="flex absolute inset-0"
        style={{
          animation: 'scroll-left-to-right 30s linear infinite',
          width: 'fit-content'
        }}
      >
        {/* First set of images */}
        {images.map((image, index) => (
          <div key={`first-${index}`} className="flex-shrink-0 w-[450px] md:w-[600px] h-full relative px-8">
            <Image
              src={image}
              alt={`Feature ${index + 1}`}
              fill
              className="object-contain px-4"
              sizes="(max-width: 768px) 450px, 600px"
              quality={100}
              priority={false}
              unoptimized={false}
            />
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {images.map((image, index) => (
          <div key={`second-${index}`} className="flex-shrink-0 w-[450px] md:w-[600px] h-full relative px-8">
            <Image
              src={image}
              alt={`Feature ${index + 1}`}
              fill
              className="object-contain px-4"
              sizes="(max-width: 768px) 450px, 600px"
              quality={100}
              priority={false}
              unoptimized={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarouselReverse;