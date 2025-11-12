import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ASCIIText from "@/components/AsciiText";
import GameOfLifeGrid from "@/components/GameOfLifeGrid";

const Hero = () => {
  return (
    <section className="container py-24 md:py-32 relative overflow-hidden">
      {/* Conway's Game of Life Grid Background - Limited to Hero */}
      <GameOfLifeGrid />

      {/* ASCII Text Background */}
      <ASCIIText
        text='GCSE_PAL'
        enableWaves={true}
        asciiFontSize={8}
      />

      <div className="flex flex-col items-center text-center relative z-20">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-lg crayon-effect">
          <span className="text-3xl font-bold text-primary-foreground">G</span>
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Your AI-powered companion
          <br />
          for GCSE <span className="text-primary crayon-text">success</span>.
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Personalized study support, smart assessments, and adaptive learning paths
          designed to help you ace your GCSEs.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="text-base" asChild>
            <Link href="/dashboard">Start Learning Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base" asChild>
            <a href="#pricing">
              See Plans
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;