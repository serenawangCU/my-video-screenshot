import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// ─── Data ───────────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name: "美 国", tons: 8133, pct: 70, active: true },
  { name: "德 国", tons: 3352, pct: 69, active: true },
  { name: "意大利", tons: 2452, pct: 66, active: true },
  { name: "法 国", tons: 2437, pct: 67, active: false },
  { name: "俄罗斯", tons: 2330, pct: 26, active: false },
];

const HEADER_DELAY = 15;
const FIRST_ROW_DELAY = 42;
const ROW_STAGGER = 28;

// ─── Deterministic star field ────────────────────────────────────────────────
const STARS = Array.from({ length: 120 }, (_, i) => {
  const a = (i * 1664525 + 1013904223) >>> 0;
  const b = (a * 1664525 + 1013904223) >>> 0;
  const c = (b * 1664525 + 1013904223) >>> 0;
  return {
    x: a % 1920,
    y: b % 1080,
    r: [2.5, 1.5, 1][i % 3],
    opacity: 0.15 + (c % 60) * 0.01,
  };
});

// ─── Gold bar SVG ─────────────────────────────────────────────────────────────
const GoldBars: React.FC<{ active: boolean }> = ({ active }) => {
  const C = active
    ? {
        highlight: "#FFF5B0",
        top: "#FFE54A",
        front: "#C8920A",
        side: "#8B6200",
        glow: "#FFD700",
      }
    : {
        highlight: "#c8c8b8",
        top: "#a0a090",
        front: "#706860",
        side: "#4a4238",
        glow: "transparent",
      };

  const DX = 10;
  const DY = -7;
  const BW = 40;
  const BH = 22;

  const Bar: React.FC<{ bx: number; by: number }> = ({ bx, by }) => (
    <g>
      {/* Right side face */}
      <polygon
        points={`${bx + BW},${by} ${bx + BW + DX},${by + DY} ${bx + BW + DX},${by + BH + DY} ${bx + BW},${by + BH}`}
        fill={C.side}
      />
      {/* Top face */}
      <polygon
        points={`${bx},${by} ${bx + BW},${by} ${bx + BW + DX},${by + DY} ${bx + DX},${by + DY}`}
        fill={C.top}
      />
      {/* Front face */}
      <rect x={bx} y={by} width={BW} height={BH} fill={C.front} />
      {/* Highlight stripe */}
      <rect
        x={bx + 5}
        y={by + 4}
        width={BW - 10}
        height={5}
        rx={2}
        fill={C.highlight}
        opacity={0.65}
      />
      {/* Bottom shadow edge */}
      <rect
        x={bx}
        y={by + BH - 3}
        width={BW}
        height={3}
        fill="rgba(0,0,0,0.3)"
      />
    </g>
  );

  // Layout: bottom 3, middle 2, top 1 (pyramid)
  const GAP = 7;
  const b1x = 5,
    b2x = 5 + BW + GAP,
    b3x = 5 + 2 * (BW + GAP);
  const m1x = b1x + (BW + GAP) / 2,
    m2x = b2x + (BW + GAP) / 2;
  const t1x = b2x;

  return (
    <svg width="165" height="115" viewBox="0 0 165 115">
      {/* Glow */}
      {active && (
        <ellipse cx={78} cy={110} rx={68} ry={7} fill={C.glow} opacity={0.28} />
      )}
      {/* Bottom row */}
      <Bar bx={b1x} by={72} />
      <Bar bx={b2x} by={72} />
      <Bar bx={b3x} by={72} />
      {/* Middle row */}
      <Bar bx={m1x} by={46} />
      <Bar bx={m2x} by={46} />
      {/* Top row */}
      <Bar bx={t1x} by={20} />
    </svg>
  );
};

// ─── Single rank row ──────────────────────────────────────────────────────────
const RankRow: React.FC<{
  country: (typeof COUNTRIES)[0];
  index: number;
}> = ({ country, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = FIRST_ROW_DELAY + index * ROW_STAGGER;
  const isActive = country.active;

  // Slide in from right
  const slide = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });
  const translateX = interpolate(slide, [0, 1], [500, 0]);
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gold bars bounce entrance
  const barsScale = spring({
    frame: frame - delay - 4,
    fps,
    config: { damping: 9, stiffness: 200, mass: 0.7 },
  });

  // Number count-up
  const countProgress = interpolate(frame, [delay + 8, delay + 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const displayTons = Math.round(country.tons * countProgress);
  const displayPct = Math.round(country.pct * countProgress);

  // Colors
  const nameColor = isActive ? "#ffffff" : "#888888";
  const tonsColor = isActive ? "#ffffff" : "#888888";
  const unitColor = isActive ? "#dddddd" : "#666666";
  const pctColor = isActive ? "#FFD700" : "#8a7a50";
  const dividerColor = isActive
    ? "rgba(255,255,255,0.35)"
    : "rgba(255,255,255,0.1)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: isActive
          ? "linear-gradient(135deg, #580f0f 0%, #7d1616 45%, #5e1010 100%)"
          : "linear-gradient(135deg, #222222 0%, #2c2c2c 50%, #222222 100%)",
        borderRadius: 14,
        height: 100,
        marginBottom: 14,
        padding: "0 36px",
        transform: `translateX(${translateX}px)`,
        opacity,
        boxShadow: isActive
          ? "0 4px 28px rgba(160,16,16,0.5), inset 0 1px 0 rgba(255,200,60,0.18)"
          : "0 3px 12px rgba(0,0,0,0.55)",
        border: isActive
          ? "1px solid rgba(255,210,60,0.28)"
          : "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Inner shine (top edge highlight for active rows) */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "38%",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.09), transparent)",
            borderRadius: "14px 14px 0 0",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Country name */}
      <div
        style={{
          width: 195,
          fontSize: 40,
          fontWeight: 900,
          color: nameColor,
          letterSpacing: "0.18em",
          fontFamily:
            "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
          flexShrink: 0,
        }}
      >
        {country.name}
      </div>

      {/* Gold bars */}
      <div
        style={{
          width: 175,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          flexShrink: 0,
          transform: `scale(${barsScale})`,
          transformOrigin: "center bottom",
        }}
      >
        <GoldBars active={isActive} />
      </div>

      {/* Tons */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 58,
            fontWeight: 900,
            color: tonsColor,
            fontVariantNumeric: "tabular-nums",
            fontFamily:
              "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
            lineHeight: 1,
          }}
        >
          {displayTons}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: unitColor,
            fontFamily:
              "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
          }}
        >
          吨
        </span>
      </div>

      {/* Dashed vertical divider */}
      <div
        style={{
          width: 0,
          height: 64,
          borderLeft: `2px dashed ${dividerColor}`,
          marginRight: 44,
          flexShrink: 0,
        }}
      />

      {/* Percentage */}
      <div
        style={{
          width: 175,
          fontSize: 52,
          fontWeight: 900,
          color: pctColor,
          textAlign: "right",
          fontFamily:
            "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
          flexShrink: 0,
        }}
      >
        {displayPct}%
      </div>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const GoldRanking: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateRight: "clamp",
  });

  const headerProgress = spring({
    frame: frame - HEADER_DELAY,
    fps,
    config: { damping: 200 },
  });
  const headerY = interpolate(headerProgress, [0, 1], [-70, 0]);
  const headerOpacity = interpolate(headerProgress, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #200c0c 0%, #120507 55%, #060103 100%)",
        fontFamily:
          "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
      }}
    >
      {/* Star field */}
      <div style={{ position: "absolute", inset: 0, opacity: bgOpacity }}>
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="white"
              opacity={s.opacity}
            />
          ))}
        </svg>
      </div>

      {/* Chart container */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 1380, opacity: bgOpacity }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 36px",
              marginBottom: 14,
              transform: `translateY(${headerY}px)`,
              opacity: headerOpacity,
            }}
          >
            <div
              style={{
                width: 195,
                color: "#aaaaaa",
                fontSize: 26,
                letterSpacing: "0.12em",
                flexShrink: 0,
              }}
            >
              官方机构
            </div>
            <div
              style={{
                width: 175,
                color: "#aaaaaa",
                fontSize: 26,
                letterSpacing: "0.12em",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              黄金储备
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 175,
                color: "#aaaaaa",
                fontSize: 26,
                letterSpacing: "0.08em",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              占外汇储备%
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 2,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,200,200,0.55) 15%, rgba(200,200,200,0.55) 85%, transparent 100%)",
              marginBottom: 22,
              transform: `translateY(${headerY}px)`,
              opacity: headerOpacity,
            }}
          />

          {/* Ranking rows */}
          {COUNTRIES.map((country, i) => (
            <RankRow key={country.name} country={country} index={i} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
