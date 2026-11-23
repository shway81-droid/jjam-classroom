// 2. 제목: 짬짬이 교실 — 수업 전후 자투리 시간을 준비 없이 바로
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, Logo, enter } from "../theme";

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text, justifyContent: "center", alignItems: "center", gap: 44 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          fontSize: 190,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          scale: interpolate(frame, [0, 22], [0.62, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Logo size={180} />
        짬짬이 교실
      </div>
      <div style={{ fontSize: 60, fontWeight: 700, color: C.muted, ...enter(frame, 22) }}>
        수업 전후 자투리 시간을 <b style={{ color: C.text, fontWeight: 900 }}>준비 없이 바로</b> 채워 드립니다
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 48,
          fontWeight: 900,
          color: C.accentText,
          background: C.accentSoft,
          padding: "16px 44px",
          borderRadius: 999,
          ...enter(frame, 46),
        }}
      >
        짬짬이.com
      </div>
    </AbsoluteFill>
  );
};
