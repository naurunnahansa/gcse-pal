"use client";

import { PricingTable } from "@clerk/nextjs";

const Pricing = () => {
  return (
    <section className="container py-24" id="pricing">
      <h2 className="mb-4 text-center text-4xl font-bold md:text-5xl">
        Simple, transparent pricing
      </h2>
      <p className="mb-16 text-center text-lg text-muted-foreground">
        Start free, upgrade when you're ready
      </p>

      <div className="max-w-4xl mx-auto">
        <PricingTable />
      </div>
    </section>
  );
};

export default Pricing;
