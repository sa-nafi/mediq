import { HeroSection } from '@/components/landing/HeroSection';
import { ClinicalExcellence } from '@/components/landing/ClinicalExcellence';
import { DiseaseSearch } from '@/components/landing/DiseaseSearch';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { PatientVoices } from '@/components/landing/PatientVoices';
import { Partners } from '@/components/landing/Partners';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <ClinicalExcellence />
      <DiseaseSearch />
      <WhyChooseUs />
      <PatientVoices />
      <Partners />
    </>
  );
}
