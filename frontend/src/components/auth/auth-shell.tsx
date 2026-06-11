import { AuthBackground } from "@/components/auth/auth-background";

export function AuthShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen bg-[#0a0f1a]">
      <AuthBackground />
      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}
