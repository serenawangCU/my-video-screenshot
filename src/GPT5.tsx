import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Img,
  staticFile,
} from "remotion";

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CX = 960;
const CY = 540;

// ─── Timeline ─────────────────────────────────────────────────────────────────
// Last badge appears at: 20 + 7×12 = 104 → settled ~130 → hold → converge
const CONVERGENCE_START = 155;
const CONVERGENCE_END = 183;
const FLASH_PEAK = 190;

// ─── Model data ───────────────────────────────────────────────────────────────
// Order: LEFT side top→bottom, then RIGHT side top→bottom
// Entrance: bubble pop (scale from 0 at final position, no flying)
const STAGGER = 5; // frames between each badge (fast, snappy appearance)
const MODELS = [
  // ── Left side, top to bottom ──
  { id: "o3",           label: "o3",             large: true,  x: 330,  y: 200,  delay: 20                },
  { id: "o3-pro",       label: "o3-pro",         large: false, x: 175,  y: 416,  delay: 20 + STAGGER      },
  { id: "4.1",          label: "4.1",            large: true,  x: 255,  y: 610,  delay: 20 + STAGGER * 2  },
  { id: "4.5",          label: "4.5",            large: true,  x: 375,  y: 800,  delay: 20 + STAGGER * 3  },
  // ── Right side, top to bottom ──
  { id: "4o",           label: "4o",             large: true,  x: 1590, y: 200,  delay: 20 + STAGGER * 4  },
  { id: "o4-mini-high", label: "o4-mini-\nhigh", large: false, x: 1735, y: 400,  delay: 20 + STAGGER * 5  },
  { id: "4.1-mini",     label: "4.1-mini",       large: false, x: 1660, y: 572,  delay: 20 + STAGGER * 6  },
  { id: "o4-mini",      label: "o4-mini",        large: false, x: 1545, y: 758,  delay: 20 + STAGGER * 7  },
];

// ─── Deterministic star field ─────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => {
  const a = (i * 1664525 + 1013904223) >>> 0;
  const b = (a * 1664525 + 1013904223) >>> 0;
  return { x: a % 1920, y: b % 1080, r: [2, 1.5, 1][i % 3], o: 0.1 + (i % 7) * 0.04 };
});

// ─── Background with teal diagonal rays ──────────────────────────────────────
const Scene1Background: React.FC = () => (
  <AbsoluteFill>
    {/* Base teal gradient */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 48%, #1d5c5a 0%, #0e3232 40%, #060f10 100%)",
      }}
    />
    {/* Diagonal ray lines */}
    <svg style={{ position: "absolute", inset: 0 }} width="1920" height="1080">
      {Array.from({ length: 48 }, (_, i) => {
        const angle = (i / 48) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={CX + Math.cos(angle) * 1700}
            y2={CY + Math.sin(angle) * 1700}
            stroke="rgba(80,220,200,1)"
            strokeWidth={30 + (i % 3) * 10}
            opacity={0.035 + (i % 5) * 0.008}
          />
        );
      })}
      {/* Stars */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
      ))}
    </svg>
    {/* Vignette */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.5) 80%)",
      }}
    />
  </AbsoluteFill>
);

// ─── OpenAI "bloom" logo (6 interlocking rounded rects at 30° intervals) ─────
const OpenAILogo: React.FC<{ size?: number }> = ({ size = 380 }) => {
  const R = size / 2;
  const PW = R * 0.27;
  const PH = R * 0.86;
  const CR = PW * 0.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-R} ${-R} ${size} ${size}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id="logo-glow-outer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="logo-glow-mid" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Diffuse outer glow */}
      <g filter="url(#logo-glow-outer)" opacity={0.45}>
        {[0, 30, 60, 90, 120, 150].map((a) => (
          <rect
            key={a}
            x={-PW / 2} y={-PH / 2}
            width={PW} height={PH} rx={CR}
            fill="none"
            stroke="#5cfff0"
            strokeWidth={R * 0.1}
            transform={`rotate(${a})`}
          />
        ))}
      </g>

      {/* Under-layer petals: 0°, 60°, 120° */}
      <g filter="url(#logo-glow-mid)">
        {[0, 60, 120].map((a) => (
          <rect
            key={a}
            x={-PW / 2} y={-PH / 2}
            width={PW} height={PH} rx={CR}
            fill="none"
            stroke="#00d8bc"
            strokeWidth={R * 0.065}
            transform={`rotate(${a})`}
          />
        ))}
      </g>

      {/* Over-layer petals: 30°, 90°, 150° */}
      <g filter="url(#logo-glow-mid)">
        {[30, 90, 150].map((a) => (
          <rect
            key={a}
            x={-PW / 2} y={-PH / 2}
            width={PW} height={PH} rx={CR}
            fill="none"
            stroke="#00d8bc"
            strokeWidth={R * 0.065}
            transform={`rotate(${a})`}
          />
        ))}
      </g>

      {/* Bright white edge highlight */}
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <rect
          key={a}
          x={-PW / 2 + 5} y={-PH / 2 + 5}
          width={PW - 10} height={PH - 10} rx={CR}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={3}
          transform={`rotate(${a})`}
        />
      ))}
    </svg>
  );
};

// ─── Energy burst (radiating lines from center) ───────────────────────────────
const EnergyBurst: React.FC<{ progress: number }> = ({ progress }) => {
  if (progress <= 0) return null;
  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      width="1920"
      height="1080"
    >
      <defs>
        <filter id="burst-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#burst-glow)">
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const startR = 30 + progress * 100;
          const endR = startR + progress * 750 * (0.6 + (i % 4) * 0.15);
          const fade = Math.max(0, 1 - progress * 1.2);
          return (
            <line
              key={i}
              x1={CX + Math.cos(angle) * startR}
              y1={CY + Math.sin(angle) * startR}
              x2={CX + Math.cos(angle) * endR}
              y2={CY + Math.sin(angle) * endR}
              stroke={i % 3 === 0 ? "#ffffff" : "#00e8d0"}
              strokeWidth={2 + (i % 3) * 1.5}
              opacity={fade}
            />
          );
        })}
      </g>
    </svg>
  );
};

// ─── Single model badge ───────────────────────────────────────────────────────
const ModelBadge: React.FC<{
  label: string;
  large: boolean;
  finalX: number;
  finalY: number;
  delay: number;
}> = ({ label, large, finalX, finalY, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Entrance: bubble pop at final position ────────────────────────────────
  // Bouncy spring (damping=7) gives the "bubble pop" overshoot feel
  const popSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 7, stiffness: 280, mass: 0.7 },
  });
  // Clamp so it never goes below 0 (spring can briefly dip negative)
  const entScale = Math.max(0, popSpring);
  const entOpacity = interpolate(frame, [delay, delay + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Convergence: all badges fly to center and shrink away ────────────────
  const convProg = interpolate(
    frame,
    [CONVERGENCE_START, CONVERGENCE_END],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }
  );

  // Position: stays at finalX/Y, then flies to center during convergence
  const currX = interpolate(convProg, [0, 1], [finalX, CX]);
  const currY = interpolate(convProg, [0, 1], [finalY, CY]);

  // Scale: pop entrance × shrink during convergence
  const convScale = interpolate(convProg, [0, 1], [1, 0]);
  const scale = entScale * convScale;
  const opacity = entOpacity * convScale;

  const D = large ? 124 : 90;
  const fs = large ? 36 : label.includes("\n") ? 18 : 22;

  return (
    <div
      style={{
        position: "absolute",
        width: D,
        height: D,
        left: currX - D / 2,
        top: currY - D / 2,
        borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, #1c1c1c, #000)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        opacity,
        boxShadow: `0 0 ${large ? 22 : 16}px rgba(0,210,185,0.3), 0 0 ${large ? 8 : 6}px rgba(0,210,185,0.15)`,
        border: "1.5px solid rgba(0,200,180,0.22)",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: fs,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.15,
          whiteSpace: "pre-line",
          fontFamily:
            "'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const GPT5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 1 fade in/out
  const scene1Opacity = interpolate(
    frame,
    [0, 15, FLASH_PEAK - 6, FLASH_PEAK + 4],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // OpenAI logo entrance
  const logoEnter = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const logoScale = interpolate(logoEnter, [0, 1], [0.2, 1]);
  const logoOpacity = interpolate(logoEnter, [0, 1], [0, 1]);

  // Logo pulses then grows during convergence
  const convProg = interpolate(frame, [CONVERGENCE_START, CONVERGENCE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoPulse = interpolate(convProg, [0, 0.4, 1], [1, 1.25, 5]);
  const logoBrightness = interpolate(convProg, [0, 0.5, 1], [1, 1.8, 1]);
  const logoFade = interpolate(convProg, [0.65, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash
  const flashOpacity = interpolate(
    frame,
    [FLASH_PEAK - 9, FLASH_PEAK, FLASH_PEAK + 14],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scene 2 (gpt5b.png) fade in
  const scene2Opacity = interpolate(frame, [FLASH_PEAK - 2, FLASH_PEAK + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Energy burst
  const burstProg = interpolate(frame, [FLASH_PEAK, FLASH_PEAK + 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000000" }}>

      {/* ─── SCENE 1: Models appearing ─── */}
      <div style={{ position: "absolute", inset: 0, opacity: scene1Opacity }}>

        {/* Teal background + rays */}
        <Scene1Background />

        {/* OpenAI logo center */}
        <div
          style={{
            position: "absolute",
            left: CX - 250,
            top: CY - 250,
            width: 500,
            height: 500,
            transform: `scale(${logoScale * logoPulse})`,
            transformOrigin: "center center",
            opacity: logoOpacity * logoFade,
            filter: `brightness(${logoBrightness})`,
          }}
        >
          <OpenAILogo size={500} />
        </div>

        {/* Model badges */}
        {MODELS.map((m) => (
          <ModelBadge
            key={m.id}
            label={m.label}
            large={m.large}
            finalX={m.x}
            finalY={m.y}
            delay={m.delay}
          />
        ))}
      </div>

      {/* ─── SCENE 2: GPT-5 reveal ─── */}
      <div style={{ position: "absolute", inset: 0, opacity: scene2Opacity }}>
        <Img
          src={staticFile("gpt5b.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Energy burst (plays over both scenes) */}
      <EnergyBurst progress={burstProg} />

      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, #ffffff 0%, #b0fff8 60%, #40e0d0 100%)",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
