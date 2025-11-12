import AnnouncementBanner from "@/components/AnnouncementBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustSection from "@/components/TrustSection";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <Header />
      <main>
        <Hero />
        <TrustSection />
        <Features />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
}