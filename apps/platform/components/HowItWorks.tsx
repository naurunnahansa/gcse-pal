const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Select Your Subjects",
      description: "Choose the GCSE subjects you're studying and let our AI assess your current knowledge level.",
    },
    {
      number: "02",
      title: "Take Quick Assessments",
      description: "Flash quizzes help identify your strengths and knowledge gaps across all topics.",
    },
    {
      number: "03",
      title: "Learn Adaptively",
      description: "Get personalized topic walkthroughs, video explainers, and AI chat support tailored to your needs.",
    },
    {
      number: "04",
      title: "Track Your Progress",
      description: "Watch your knowledge graph grow as you master topics and get ready for exam success.",
    },
  ];

  return (
    <section className="bg-gray-50 py-24">
      <div className="container">
          <h2 className="mb-16 text-center text-4xl font-bold md:text-5xl">
            How it works
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col">
                <span className="mb-4 text-5xl font-bold text-muted-foreground">
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