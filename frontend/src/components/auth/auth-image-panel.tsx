import authHeroImage from "@/assets/Images/ai-robotic-arm-interacting-with-data-visualization.jpg";

const CLIP_ID = "lumen-auth-panel-clip";

const W = 460;
const H = 620;
const SCOOP = 130;
const ROUND = 56;

const PANEL_PATH = [
  `M ${SCOOP} 0`,
  `H ${W - ROUND}`,
  `A ${ROUND} ${ROUND} 0 0 1 ${W} ${ROUND}`,
  `V ${H - SCOOP}`,
  `A ${SCOOP} ${SCOOP} 0 0 0 ${W - SCOOP} ${H}`,
  `H ${ROUND}`,
  `A ${ROUND} ${ROUND} 0 0 1 0 ${H - ROUND}`,
  `V ${SCOOP}`,
  `A ${SCOOP} ${SCOOP} 0 0 0 ${SCOOP} 0`,
  "Z",
].join(" ");

export function AuthImagePanel() {
  return (
    <div className="relative z-10 w-full max-w-[min(100%,380px)]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full drop-shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        role="img"
        aria-label="AI robotic arm interacting with enterprise data visualization"
      >
        <defs>
          <clipPath id={CLIP_ID} clipPathUnits="userSpaceOnUse">
            <path d={PANEL_PATH} />
          </clipPath>
          <linearGradient
            id="auth-panel-overlay"
            x1="0"
            y1="0"
            x2={W}
            y2={H}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(10,15,26,0.15)" />
            <stop offset="50%" stopColor="rgba(10,15,26,0)" />
            <stop offset="100%" stopColor="rgba(10,15,26,0.25)" />
          </linearGradient>
        </defs>

        <image
          href={authHeroImage.src}
          width={W}
          height={H}
          clipPath={`url(#${CLIP_ID})`}
          preserveAspectRatio="xMidYMid slice"
        />

        <path
          d={PANEL_PATH}
          fill="url(#auth-panel-overlay)"
          style={{ pointerEvents: "none" }}
        />

        <path
          d={PANEL_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
