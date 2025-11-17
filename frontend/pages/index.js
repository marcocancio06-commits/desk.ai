import Hero from '../components/marketing/Hero';
import SocialProof from '../components/marketing/SocialProof';
import HowItWorks from '../components/marketing/HowItWorks';
import FeaturesGrid from '../components/marketing/FeaturesGrid';
import WhyDesk from '../components/marketing/WhyDesk';
import PricingTeaser from '../components/marketing/PricingTeaser';
import FinalCTA from '../components/marketing/FinalCTA';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <SocialProof />
      <HowItWorks />
      <FeaturesGrid />
      <WhyDesk />
      <PricingTeaser />
      <FinalCTA />
    </div>
  );
}

