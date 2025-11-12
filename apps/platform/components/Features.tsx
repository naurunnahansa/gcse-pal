import { Brain, BookOpen, Network } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "Smart Quizzes",
      description:
        "Adaptive assessments, practice exams, and real-time feedback that identify your knowledge gaps and accelerate learning.",
    },
    {
      icon: BookOpen,
      title: "Personalized Learning Paths",
      description:
        "Your AI assistant Pal adapts to your learning style with custom content, video explanations, and 24/7 support.",
    },
    {
      icon: Network,
      title: "Progress Visualization",
      description:
        "Track your progress in real-time with an interactive knowledge graph that expands as you master new topics and skills.",
    },
  ];

  return (
    <section className="container py-24 relative">
      <div className="relative z-10">
        <h2 className="mb-16 text-center text-4xl font-bold md:text-5xl">
          Powered by Your AI Assistant Pal
        </h2>

        <div className="grid gap-12 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col items-start">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary crayon-effect">
              <feature.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
