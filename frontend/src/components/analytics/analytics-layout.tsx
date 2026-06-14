"use client";

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

export function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return <div className="pb-10 md:pb-12">{children}</div>;
}
