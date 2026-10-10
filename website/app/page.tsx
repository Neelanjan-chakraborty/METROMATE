import { Nav } from '@/components/Nav';
import { Hero } from '@/components/sections/Hero';
import { LittleThings } from '@/components/sections/LittleThings';
import { Showcase } from '@/components/sections/Showcase';
import { FeatureStory } from '@/components/sections/FeatureStory';
import { JourneyDemo } from '@/components/sections/JourneyDemo';
import { OfflineSection } from '@/components/sections/OfflineSection';
import { CommuterNotes } from '@/components/sections/CommuterNotes';
import { Faq } from '@/components/sections/Faq';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <LittleThings />
        <Showcase />
        <FeatureStory />
        <JourneyDemo />
        <OfflineSection />
        <CommuterNotes />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
