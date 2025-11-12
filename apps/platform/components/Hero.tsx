import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, BookOpen, Award } from "lucide-react";
import Link from "next/link";
import ASCIIText from "@/components/AsciiText";
import GameOfLifeGrid from "@/components/GameOfLifeGrid";
import CardSwap, { Card } from "@/components/CardSwap";

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

        {/* CardSwap Feature Cards */}
        <CardSwap
          width={320}
          height={200}
          cardDistance={40}
          verticalDistance={50}
          delay={4000}
          pauseOnHover={true}
          skewAmount={4}
          easing="elastic"
        >
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border-orange-400/50 p-6 shadow-2xl">
            <div className="text-white">
              <Brain className="h-8 w-8 mb-3 text-orange-300" />
              <h3 className="text-lg font-bold mb-2">Smart Assessments</h3>
              <p className="text-sm opacity-90">Adaptive quizzes and mock exams that identify your knowledge gaps in real-time.</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border-orange-400/50 p-6 shadow-2xl">
            <div className="text-white">
              <BookOpen className="h-8 w-8 mb-3 text-orange-300" />
              <h3 className="text-lg font-bold mb-2">Personalized Learning</h3>
              <p className="text-sm opacity-90">AI-powered study support that adapts to your unique learning style.</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border-orange-400/50 p-6 shadow-2xl">
            <div className="text-white">
              <Award className="h-8 w-8 mb-3 text-orange-300" />
              <h3 className="text-lg font-bold mb-2">Track Progress</h3>
              <p className="text-sm opacity-90">Visual knowledge graph showing your mastery across all GCSE topics.</p>
            </div>
          </Card>
        </CardSwap>
      </div>
    </section>
  );
};

export default Hero;