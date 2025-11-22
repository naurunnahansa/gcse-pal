"use client";

import { PricingTable } from "@clerk/nextjs";

export default function UpgradePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upgrade Your Plan</h1>
        <p className="text-muted-foreground">
          Choose the plan that best fits your learning needs
        </p>
      </div>

      <PricingTable />
    </div>
  );
}
