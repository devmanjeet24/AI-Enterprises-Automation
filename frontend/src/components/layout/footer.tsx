import Link from "next/link";

import { Container } from "./container";
import { siteConfig } from "@/config/site";

const footerLinks = {
  product: [
    { label: "Platform", href: "#platform" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#resources" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Security", href: "#" },
    { label: "Status", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "DPA", href: "#" },
  ],
} as const;

function Footer() {
  return (
    <footer className="border-t border-border bg-elevated">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-sm font-medium text-foreground">
              {siteConfig.name}
              <span className="text-muted-foreground">.ai</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <FooterColumn title="Product" links={footerLinks.product} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Resources" links={footerLinks.resources} />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-tertiary">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-6">
            {footerLinks.legal.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs text-tertiary transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { Footer };
