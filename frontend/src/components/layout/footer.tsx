import Link from "next/link";

import { Container } from "./container";
import { siteConfig } from "@/config/site";

type FooterLink = {
  label: string;
  href?: string;
  external?: boolean;
  comingSoon?: boolean;
};

const footerLinks = {
  product: [
    { label: "Platform", href: "/#platform" },
    { label: "Solutions", href: "/#solutions" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Resources", href: "/#resources" },
  ],
  company: [
    { label: "About", href: "/#platform" },
    { label: "Blog", comingSoon: true },
    { label: "Careers", comingSoon: true },
    { label: "Contact", href: "mailto:support@lumen.ai" },
  ],
  resources: [
    { label: "Documentation", href: "/#resources" },
    {
      label: "API Reference",
      href: `${siteConfig.apiUrl}/docs`,
      external: true,
    },
    { label: "Security", href: "/#platform" },
    { label: "Status", href: "/#platform" },
  ],
  legal: [
    { label: "Privacy", comingSoon: true },
    { label: "Terms", comingSoon: true },
    { label: "DPA", comingSoon: true },
  ],
} as const satisfies Record<string, readonly FooterLink[]>;

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
                <FooterLinkItem
                  link={link}
                  className="text-xs text-tertiary transition-colors hover:text-muted-foreground"
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function FooterLinkItem({
  link,
  className,
}: {
  link: FooterLink;
  className?: string;
}) {
  if (link.comingSoon || !link.href) {
    return (
      <span className={className} title="Coming soon">
        {link.label}
      </span>
    );
  }

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem
              link={link}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export { Footer };
