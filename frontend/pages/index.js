import Navbar from '../components/marketing/Navbar';
import Hero from '../components/marketing/Hero';
import SocialProof from '../components/marketing/SocialProof';
import HowItWorks from '../components/marketing/HowItWorks';
import WhoItIsFor from '../components/marketing/WhoItIsFor';
import FeaturesGrid from '../components/marketing/FeaturesGrid';
import WhatChanges from '../components/marketing/WhatChanges';
import WhyDesk from '../components/marketing/WhyDesk';
import PricingTeaser from '../components/marketing/PricingTeaser';
import FinalCTA from '../components/marketing/FinalCTA';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <WhoItIsFor />
      <div id="features">
        <FeaturesGrid />
      </div>
      <WhatChanges />
      <WhyDesk />
      <div id="pricing">
        <PricingTeaser />
      </div>
      <FinalCTA />
    </div>
  );
}

