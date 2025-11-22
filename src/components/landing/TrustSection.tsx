const TrustSection = () => {
  const stats = [
    { value: "50,000+", label: "Students learning" },
    { value: "15+", label: "Subjects" },
    { value: "94%", label: "Grade improvement" },
    { value: "4.9/5", label: "Student rating" },
  ];

  return (
    <section className="container py-12">
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Trusted by students everywhere
      </p>
      <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center"
          >
            <span className="text-3xl font-bold text-primary">
              {stat.value}
            </span>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustSection;
