import { cn } from "@/lib/utils";

type AmbientVariant = "default" | "warm" | "cool" | "brand";

const ambientStyles: Record<AmbientVariant, string> = {
  default:
    "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(212,168,67,0.06), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 60%, rgba(59,91,168,0.05), transparent 50%)",
  warm: "radial-gradient(ellipse 60% 45% at 20% 20%, rgba(212,168,67,0.07), transparent 55%), radial-gradient(ellipse 50% 35% at 80% 80%, rgba(245,197,24,0.04), transparent 50%)",
  cool: "radial-gradient(ellipse 60% 45% at 80% 15%, rgba(59,91,168,0.07), transparent 55%), radial-gradient(ellipse 50% 35% at 10% 70%, rgba(99,130,200,0.04), transparent 50%)",
  brand:
    "radial-gradient(ellipse 65% 50% at 50% 0%, rgba(245,197,24,0.08), transparent 60%), radial-gradient(ellipse 40% 30% at 100% 50%, rgba(59,91,168,0.04), transparent 50%)",
};

interface SectionAmbientProps {
  variant?: AmbientVariant;
  className?: string;
}

export function SectionAmbient({
  variant = "default",
  className,
}: SectionAmbientProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ background: ambientStyles[variant] }}
      />
      <div className="section-grid-fade absolute inset-0 opacity-40" />
    </div>
  );
}
