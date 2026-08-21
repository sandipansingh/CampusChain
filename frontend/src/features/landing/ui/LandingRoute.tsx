import { BottomCTA } from "./BottomCTA";
import { FeaturesGrid } from "./FeaturesGrid";
import { Footer } from "./Footer";
import { ForUniversities } from "./ForUniversities";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Navbar } from "./Navbar";

export function LandingRoute({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground transition-colors">
      <Navbar onGetStarted={onGetStarted} />
      <main>
        <Hero onGetStarted={onGetStarted} />
        <HowItWorks />
        <FeaturesGrid />
        <ForUniversities />
        <BottomCTA onGetStarted={onGetStarted} />
      </main>
      <Footer />
    </div>
  );
}

export default LandingRoute;
