// 7. 마무리: 짬짬이 교실 — 짬짬이.com
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { SITES } from "../sites";
import { C, FONT, Logo, SiteIcon, enter } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.hero, fontFamily: FONT, color: "#fff", justifyContent: "center", alignItems: "center", gap: 34 }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: "rgba(255,255,255,0.9)", ...enter(frame, 0) }}>남는 시간이 생기면</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 34,
          fontSize: 168,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          scale: interpolate(frame, [10, 30], [0.82, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 14 }),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [10, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <Logo size={156} />
        짬짬이 교실
      </div>
      <div style={{ fontSize: 76, fontWeight: 900, color: C.accent, ...enter(frame, 30) }}>짬짬이.com</div>

      <div style={{ display: "flex", gap: 20, marginTop: 30, ...enter(frame, 44) }}>
        {SITES.map((s) => (
          <SiteIcon key={s.key} site={s.key} size={80} />
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 78, fontSize: 32, fontWeight: 600, color: "rgba(255,255,255,0.6)", ...enter(frame, 54) }}>
        모두 무료 · 설치 없음 · 로그인 없음
      </div>
    </AbsoluteFill>
  );
};
