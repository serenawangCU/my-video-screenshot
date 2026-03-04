import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─── 2023年全国政府一般公共预算收入数据 ──────────────────────────────────────
const TAX_ROWS = [
  {
    rank: 1,
    name: "国内增值税",
    nameEn: "Domestic Value-Added Tax (VAT)",
    total: 69332,
    central: 34588,
    local: 34746,
  },
  {
    rank: 2,
    name: "企业所得税",
    nameEn: "Corporate Income Tax",
    total: 41098,
    central: 26409,
    local: 14693,
  },
  {
    rank: 3,
    name: "非税收入",
    nameEn: "Non-Tax Revenue",
    total: 35683,
    central: 3732,
    local: 31951,
  },
  {
    rank: 4,
    name: "国内消费税",
    nameEn: "Domestic Consumption Tax",
    total: 16118,
    central: 16118,
    local: 0,
  },
  {
    rank: 5,
    name: "个人所得税",
    nameEn: "Personal Income Tax",
    total: 14778,
    central: 7389,
    local: 7389,
  },
];

// ─── Timing ───────────────────────────────────────────────────────────────────
const ENTER_START = 15;
const ROW_STAGGER = 20;
// Last row starts at 15 + 4*20 = 95, settles ~125
const HIGHLIGHT_START = 150; // ~5s in
const HIGHLIGHT_END = 188;   // ~40-frame smooth transition

const fmt = (n: number) => n.toLocaleString("en-US");

// ─── Data Row ────────────────────────────────────────────────────────────────
const DataRow: React.FC<{
  row: (typeof TAX_ROWS)[0];
  index: number;
  isVAT: boolean;
  highlightProgress: number;
}> = ({ row, index, isVAT, highlightProgress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = ENTER_START + index * ROW_STAGGER;

  const enterProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 180, stiffness: 70 },
  });

  const enterOpacity = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(enterProgress, [0, 1], [60, 0]);

  // Non-VAT rows fade out; VAT row stays full
  const rowOpacity = isVAT
    ? 1
    : interpolate(highlightProgress, [0, 1], [1, 0.15]);

  // VAT row: golden glow grows in
  const vatGlow = isVAT ? highlightProgress : 0;

  // VAT row: subtle scale-up to draw attention
  const vatScale = isVAT
    ? interpolate(highlightProgress, [0, 1], [1, 1.018])
    : 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "#ffffff",
        borderRadius: 14,
        marginBottom: 12,
        height: 90,
        transform: `translateY(${translateY}px) scale(${vatScale})`,
        opacity: enterOpacity * rowOpacity,
        boxShadow: isVAT
          ? `0 4px 20px rgba(0,0,0,${0.07 + vatGlow * 0.38}), 0 0 0 ${vatGlow * 3}px rgba(255, 210, 30, ${vatGlow * 0.7})`
          : "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Gold left accent (VAT only, fades in during highlight) */}
      <div
        style={{
          width: isVAT ? 6 : 0,
          background: `rgba(230, 175, 0, ${vatGlow})`,
          flexShrink: 0,
          transition: "none",
        }}
      />

      {/* Rank */}
      <div
        style={{
          width: isVAT ? 64 : 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 700,
          color: "#bbbbcc",
          flexShrink: 0,
        }}
      >
        {row.rank}
      </div>

      {/* Tax name */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: 16,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: "#1a1a2e",
            letterSpacing: "0.04em",
          }}
        >
          {row.name}
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#9999aa",
            marginTop: 4,
            letterSpacing: "0.02em",
          }}
        >
          {row.nameEn}
        </div>
      </div>

      {/* Total — 全国政府 */}
      <div
        style={{
          width: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 30,
          fontSize: 38,
          fontWeight: 700,
          color: "#2c2c3e",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        {fmt(row.total)}
      </div>

      {/* Central — 中央政府 */}
      <div
        style={{
          width: 270,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          fontWeight: 700,
          color: "#ffffff",
          background: "rgba(148, 24, 24, 0.92)",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
        }}
      >
        {fmt(row.central)}
      </div>

      {/* Local — 地方政府 */}
      <div
        style={{
          width: 270,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          fontWeight: 700,
          color: "#ffffff",
          background: "rgba(24, 52, 128, 0.92)",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
        }}
      >
        {fmt(row.local)}
      </div>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const Revenue: React.FC = () => {
  const frame = useCurrentFrame();

  const highlightProgress = interpolate(
    frame,
    [HIGHLIGHT_START, HIGHLIGHT_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Page background: light (#f4f7fa) → dark (#161820)
  const bgR = Math.round(interpolate(highlightProgress, [0, 1], [244, 22]));
  const bgG = Math.round(interpolate(highlightProgress, [0, 1], [247, 24]));
  const bgB = Math.round(interpolate(highlightProgress, [0, 1], [250, 32]));

  // Title & header fade in
  const topFade = interpolate(frame, [ENTER_START - 5, ENTER_START + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title text color: dark in light mode → light in dark mode
  const titleC = Math.round(interpolate(highlightProgress, [0, 1], [26, 210]));
  const subC = Math.round(interpolate(highlightProgress, [0, 1], [120, 100]));

  // Header label colors
  const headerTextC = Math.round(interpolate(highlightProgress, [0, 1], [100, 130]));

  // Divider opacity
  const dividerA = interpolate(highlightProgress, [0, 1], [0.3, 0.12]);

  return (
    <AbsoluteFill
      style={{
        background: `rgb(${bgR},${bgG},${bgB})`,
        fontFamily:
          "'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 1440 }}>
        {/* ── Title ─────────────────────────────────────────────────────── */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 38,
            opacity: topFade,
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              color: `rgb(${titleC},${titleC},${Math.round(titleC * 1.08)})`,
              letterSpacing: "0.1em",
            }}
          >
            2023年全国政府一般公共预算收入
          </div>
          <div
            style={{
              fontSize: 22,
              color: `rgb(${subC},${subC},${Math.round(subC * 1.1)})`,
              marginTop: 10,
              letterSpacing: "0.08em",
            }}
          >
            单位：亿元人民币
          </div>
        </div>

        {/* ── Column headers ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            opacity: topFade,
            marginBottom: 12,
            paddingLeft: 76,
          }}
        >
          {/* 税种 */}
          <div
            style={{
              flex: 1,
              fontSize: 22,
              color: `rgb(${headerTextC},${headerTextC},${Math.round(headerTextC * 1.1)})`,
              letterSpacing: "0.1em",
            }}
          >
            税种
          </div>
          {/* 全国政府 */}
          <div
            style={{
              width: 220,
              fontSize: 22,
              color: `rgb(${headerTextC},${headerTextC},${Math.round(headerTextC * 1.1)})`,
              textAlign: "right",
              paddingRight: 30,
              letterSpacing: "0.08em",
            }}
          >
            全国政府
          </div>
          {/* 中央政府 */}
          <div
            style={{
              width: 270,
              fontSize: 22,
              color: "#cc4444",
              textAlign: "center",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            中央政府
          </div>
          {/* 地方政府 */}
          <div
            style={{
              width: 270,
              fontSize: 22,
              color: "#4466cc",
              textAlign: "center",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            地方政府
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `rgba(160,160,180,${dividerA})`,
            marginBottom: 16,
            opacity: topFade,
          }}
        />

        {/* ── Data rows ─────────────────────────────────────────────────── */}
        {TAX_ROWS.map((row, i) => (
          <DataRow
            key={row.rank}
            row={row}
            index={i}
            isVAT={row.rank === 3}
            highlightProgress={highlightProgress}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
