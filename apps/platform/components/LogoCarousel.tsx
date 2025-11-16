"use client";

const LogoCarousel = () => {
  const logos = [
    "TechCorp",
    "LearnAI",
    "EduFlow",
    "SmartStudy",
    "MindSpark",
    "KnowledgeHub",
    "StudyPro",
    "BrainWave"
  ];

  return (
    <>
      <style jsx>{`
        @keyframes scroll-logos {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-logos {
          animation: scroll-logos 20s linear infinite;
        }
      `}</style>
      <div className="w-full py-8 border-y border-gray-200 bg-gray-50 overflow-hidden">
        <div className="flex animate-logos" style={{ width: 'fit-content' }}>
          {/* First set of logos */}
          {logos.map((logo, index) => (
            <div key={`first-${index}`} className="flex items-center justify-center px-12 h-16 text-gray-400 font-medium text-lg whitespace-nowrap">
              {logo}
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {logos.map((logo, index) => (
            <div key={`second-${index}`} className="flex items-center justify-center px-12 h-16 text-gray-400 font-medium text-lg whitespace-nowrap">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LogoCarousel;