import { Section } from "@/components/layout/section";

export default function HomePage() {
  return (
    <Section spacing="hero" className="hero-gradient">
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-tertiary">
          Design foundation ready — feature sections coming next.
        </p>
      </div>
    </Section>
  );
}
