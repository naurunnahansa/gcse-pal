import AnnouncementBanner from "@/components/landing/AnnouncementBanner";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TrustSection from "@/components/landing/TrustSection";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import CoursesPreview from "@/components/landing/CoursesPreview";
import Footer from "@/components/landing/Footer";
import FloatingChat from "@/components/landing/FloatingChat";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <Header />
      <main>
        <Hero />
        <TrustSection />
        <Features />
        <CoursesPreview />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
}
