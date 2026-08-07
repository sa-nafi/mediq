import { HeroSection } from '@/components/landing/HeroSection';
import { TrustStats } from '@/components/landing/TrustStats';
import { DiagnosticServices } from '@/components/landing/DiagnosticServices';
import { PopularPackages } from '@/components/landing/PopularPackages';
import { TestSearch } from '@/components/landing/TestSearch';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { DigitalReports } from '@/components/landing/DigitalReports';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { Partners } from '@/components/landing/Partners';
import { FinalCTA } from '@/components/landing/FinalCTA';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <TrustStats />
      <DiagnosticServices />
      <PopularPackages />
      <TestSearch />
      <WhyChooseUs />
      <DigitalReports />
      <HowItWorks />
      <Testimonials />
      <Partners />
      <FinalCTA />
    </>
  );
}
