import {
  AiEmployeeStudioSection,
  AnalyticsSection,
  BrowserAutomationSection,
  BusinessResearchHubSection,
  CtaSection,
  HeroSection,
  HeroVisualSection,
  KnowledgeIntelligenceSection,
  MultiAgentCollaborationSection,
  PlatformOverviewSection,
  PricingSection,
  TestimonialsSection,
  WorkflowAutomationSection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HeroVisualSection />
      <PlatformOverviewSection />
      <AiEmployeeStudioSection />
      <KnowledgeIntelligenceSection />
      <MultiAgentCollaborationSection />
      <WorkflowAutomationSection />
      <BusinessResearchHubSection />
      <BrowserAutomationSection />
      <AnalyticsSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
    </>
  );
}
