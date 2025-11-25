import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeaturedProsSection from '../components/landing/FeaturedProsSection';
import DeskAIShowcaseSection from '../components/landing/DeskAIShowcaseSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import PricingSection from '../components/landing/PricingSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import { MARKETPLACE_ENABLED } from '../lib/featureFlags';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      {MARKETPLACE_ENABLED && <FeaturedProsSection />}
      <DeskAIShowcaseSection />
      <BenefitsSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <FinalCTASection />
      <Footer />
    </div>
  );
}

