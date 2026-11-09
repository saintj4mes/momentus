import { SiteHeader } from "./homepage/site-header";
import { HeroSection } from "./homepage/hero-section";
import { EventsShowcaseSection } from "./homepage/events-showcase";
import { JourneySection } from "./homepage/journey-section";
import { ValueSection } from "./homepage/value-section";
import { DesignerShowcase } from "./homepage/designer-showcase";
import { MemoriesShowcase } from "./homepage/memories-showcase";
import { CtaBanner } from "./homepage/cta-banner";
import { SiteFooter } from "./homepage/site-footer";
import { ScrollRevealProvider } from "./homepage/scroll-reveal";

export function ExperiencePreview() {
  return (
    <ScrollRevealProvider>
      <div className="homepage-wrapper vintage-grain">
        <SiteHeader />
        <main id="main-content">
          <HeroSection />
          <EventsShowcaseSection />
          <JourneySection />
          <ValueSection />
          <DesignerShowcase />
          <MemoriesShowcase />
          <CtaBanner />
        </main>
        <SiteFooter />
      </div>
    </ScrollRevealProvider>
  );
}
