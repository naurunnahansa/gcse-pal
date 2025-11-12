const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Select Your Subjects",
      description: "Choose your GCSE subjects and let your AI assistant Pal assess your current knowledge level.",
    },
    {
      number: "02",
      title: "Take Quick Assessments",
      description: "Smart quizzes identify your strengths and knowledge gaps, creating your personalized learning profile.",
    },
    {
      number: "03",
      title: "Learn Adaptively",
      description: "Pal delivers tailored content, video explanations, and 24/7 AI support that matches your learning style.",
    },
    {
      number: "04",
      title: "Track Your Progress",
      description: "Watch your progress visualization expand in real-time as you master topics and prepare for exam success.",
    },
  ];

  return (
    <section className="bg-gray-50 py-24">
      <div className="container">
          <h2 className="mb-16 text-center text-4xl font-bold md:text-5xl">
            How Your Pal Works
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col">
                <span className="mb-4 text-5xl font-bold text-primary crayon-text">
                  {step.number}
                </span>
                <h3 className="mb-3 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;