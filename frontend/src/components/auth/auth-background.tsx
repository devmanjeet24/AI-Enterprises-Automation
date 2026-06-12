export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0f1a]" aria-hidden>
      {/* Ambient gradient patches — behind grid */}
      <div className="absolute inset-0">
        <div
          className="absolute -left-24 top-[6%] h-[480px] w-[480px]"
          style={{
            background:
              "radial-gradient(circle, rgba(72, 110, 200, 0.38) 0%, rgba(59, 91, 168, 0.16) 38%, transparent 68%)",
            filter: "blur(48px)",
          }}
        />
        <div
          className="absolute -right-12 top-[4%] h-[400px] w-[400px]"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 197, 24, 0.28) 0%, rgba(212, 168, 67, 0.12) 40%, transparent 68%)",
            filter: "blur(44px)",
          }}
        />
        <div
          className="absolute bottom-[10%] left-[15%] h-[360px] w-[360px]"
          style={{
            background:
              "radial-gradient(circle, rgba(110, 145, 220, 0.26) 0%, rgba(59, 91, 168, 0.1) 42%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] h-[320px] w-[320px]"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 197, 24, 0.22) 0%, rgba(212, 168, 67, 0.08) 45%, transparent 70%)",
            filter: "blur(36px)",
          }}
        />
        <div
          className="absolute left-1/2 top-[38%] h-[240px] w-[240px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 35%, transparent 65%)",
            filter: "blur(32px)",
          }}
        />
      </div>

      {/* Grid on top — thin lines, gradients still bleed through */}
      <div className="auth-grid absolute inset-0 z-[1]" />
    </div>
  );
}
