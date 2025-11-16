"use client";

import Image from "next/image";

const ImageCarousel = () => {
  const images = [
    "/assets/Frame 1.png",
    "/assets/Frame 4.png",
    "/assets/Frame 3.png",
  ];

  return (
    <div className="relative w-full h-[250px] overflow-hidden">
      <div
        className="flex absolute inset-0"
        style={{
          animation: 'scroll-right-to-left 30s linear infinite',
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
              priority={index === 0}
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

export default ImageCarousel;