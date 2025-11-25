import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import MarketingLayout from '../components/marketing/MarketingLayout';
import DarkHeroSection from '../components/landing/DarkHeroSection';
import ProblemSolutionSection from '../components/landing/ProblemSolutionSection';
import FeatureShowcaseSection from '../components/landing/FeatureShowcaseSection';
import PricingSection from '../components/landing/PricingSection';
import CTAStrip from '../components/landing/CTAStrip';
import { MARKETPLACE_ENABLED } from '../lib/featureFlags';

export default function Home() {
  return (
    <MarketingLayout>
      <Navbar />
      <DarkHeroSection />
      <ProblemSolutionSection />
      <FeatureShowcaseSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <CTAStrip />
      <Footer />
    </MarketingLayout>
  );
}

