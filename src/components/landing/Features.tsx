import Image from "next/image";

const Features = () => {
  const features = [
    {
      image: "/assets/Frame 1.png",
      title: "Smart Quizzes",
      description: "Adaptive assessments that identify your knowledge gaps and accelerate learning with intelligent question generation and personalized feedback."
    },
    {
      image: "/assets/Frame 3.png",
      title: "Personalized Learning",
      description: "AI assistant that adapts to your learning style with custom content and support tailored to your individual needs and preferences."
    },
    {
      image: "/assets/Frame 4.png",
      title: "Progress Tracking",
      description: "Interactive knowledge graph that expands as you master new topics and skills, providing visual insights into your learning journey."
    },
    {
      image: "/assets/Frame 1.png",
      title: "24/7 Support",
      description: "Round-the-clock assistance whenever you need help with your studies, including instant answers and detailed explanations."
    }
  ];

  return (
    <>
      <section className="w-full py-24 relative">
        <div className="w-full">
          <div className="grid grid-cols-2 gap-2 md:gap-3 max-w-5xl mx-auto px-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-3">
                <div className="mb-4 w-full">
                  <div className="relative w-full h-auto">
                    <Image
                      src={feature.image}
                      alt=""
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto object-contain"
                      quality={100}
                      priority={index < 4}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
