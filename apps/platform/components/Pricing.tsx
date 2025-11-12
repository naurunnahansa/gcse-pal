import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "£0",
      period: "forever",
      description: "Perfect for trying out GCSEPal",
      features: [
        "3 subjects",
        "5 flash quizzes per week",
        "Basic topic walkthroughs",
        "Community support",
      ],
      cta: "Get Started",
      featured: false,
    },
    {
      name: "Student",
      price: "£9.99",
      period: "per month",
      description: "Everything you need to succeed",
      features: [
        "Unlimited subjects",
        "Unlimited flash quizzes",
        "Full topic walkthroughs & videos",
        "AI chat support",
        "Mid exams & mock exams",
        "Knowledge graph tracking",
        "Progress analytics",
      ],
      cta: "Start Free Trial",
      featured: true,
    },
    {
      name: "Premium",
      price: "£14.99",
      period: "per month",
      description: "For serious exam preparation",
      features: [
        "Everything in Student plan",
        "1-on-1 tutor sessions",
        "Priority AI response",
        "Custom study plans",
        "Exam prediction insights",
        "Parent progress reports",
      ],
      cta: "Start Free Trial",
      featured: false,
    },
  ];

  return (
    <section className="container py-24" id="pricing">
        <h2 className="mb-4 text-center text-4xl font-bold md:text-5xl">
          Simple, transparent pricing
        </h2>
        <p className="mb-16 text-center text-lg text-muted-foreground">
          Start free, upgrade when you're ready
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.featured
                  ? "border-primary bg-primary text-primary-foreground crayon-effect"
                  : "border-border bg-background"
              }`}
            >
              <h3 className="mb-2 text-lg font-semibold">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span
                  className={`ml-2 text-sm ${
                    plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`mb-6 text-sm ${
                  plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {plan.description}
              </p>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 ${
                        plan.featured ? "text-primary-foreground" : "text-foreground"
                      }`}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? "outline" : "default"}
                className={`w-full ${
                  plan.featured
                    ? "border-primary-foreground bg-primary-foreground text-primary hover:bg-primary-foreground/90 crayon-effect"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground crayon-effect"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
      </div>
    </section>
  );
};

export default Pricing;