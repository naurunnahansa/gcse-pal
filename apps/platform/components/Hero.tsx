import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import GameOfLifeGrid from "@/components/GameOfLifeGrid";

const Hero = () => {
  return (
    <section className="container py-24 md:py-32 relative overflow-hidden">
      {/* Conway's Game of Life Grid Background - Limited to Hero */}
      <GameOfLifeGrid />

      <div className="flex flex-col items-center text-center relative z-20">

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Ready for that <span className="text-primary crayon-text">A*</span>?
        </h1>


        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="text-base" asChild>
            <Link href="/dashboard">Start Learning Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base" asChild>
            <a href="#pricing">
              View Plans
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
