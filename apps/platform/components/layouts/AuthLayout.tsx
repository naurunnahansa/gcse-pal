import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Brain, Award, Users } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
  backTo?: string;
  backText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  description,
  showBackButton = false,
  backTo = "/",
  backText = "Back to Home"
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="w-1/2 flex flex-col justify-center bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-200">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-gray-600 hover:text-gray-900"
            >
              <Link href={backTo} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {backText}
              </Link>
            </Button>
          )}

          <div className="flex items-center justify-center pl-4">
          <Image
            src="/logo-full.png"
            alt="GCSEPal"
            width={100}
            height={44}
            className="object-contain"
            quality={100}
            priority
          />
        </div>

          {!showBackButton && <div className="w-16"></div>}
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm">
            {/* Mobile Title - Hidden on desktop */}
            <div className="lg:hidden text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your AI-powered companion for GCSE success
              </h2>
              <p className="text-gray-600">
                Personalized study support to help you ace your GCSEs
              </p>
            </div>

            {/* Form Content */}
            <div>
              {/* Desktop Title - Hidden on mobile */}
              <div className="hidden lg:block mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                {description && (
                  <p className="text-gray-600">{description}</p>
                )}
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white"></div>
          <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-white"></div>
          <div className="absolute bottom-20 left-32 w-24 h-24 rounded-full bg-white"></div>
          <div className="absolute bottom-40 right-40 w-12 h-12 rounded-full bg-white"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12">
          {/* Top Section */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black">
                <span className="text-2xl font-bold">G</span>
              </div>
              <h1 className="text-3xl font-bold">GCSEPal</h1>
            </div>

            <h2 className="text-4xl font-bold mb-4">
              Your AI-powered companion for GCSE success
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Personalized study support, smart assessments, and adaptive learning paths designed to help you ace your GCSEs.
            </p>
          </div>

          {/* Bottom Section - Features */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Assessments</h3>
                <p className="opacity-80">Adaptive quizzes that identify your knowledge gaps</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Personalized Learning</h3>
                <p className="opacity-80">AI-powered chat support tailored to your style</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Track Progress</h3>
                <p className="opacity-80">Visual knowledge graph of your learning journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};