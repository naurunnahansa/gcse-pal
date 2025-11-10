import { Brain, BookOpen, Network } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "Smart Assessments",
      description:
        "Flash quizzes, mid exams, and full mock exams that adapt to your knowledge level and identify gaps in real-time.",
    },
    {
      icon: BookOpen,
      title: "Personalized Learning",
      description:
        "Topic walkthroughs, video explainers, and AI-powered chat support that adapts to your unique learning style.",
    },
    {
      icon: Network,
      title: "Knowledge Graph",
      description:
        "Visual representation of your understanding across all topics, automatically built from your interactions and progress.",
    },
  ];

  return (
    <section className="container py-24">
        <h2 className="mb-16 text-center text-4xl font-bold md:text-5xl">
          Everything you need to ace your GCSEs
        </h2>

      <div className="grid gap-12 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col items-start">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black">
              <feature.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;