// 5. 바로가기: 사이트끼리 머리 위 줄로 한 번에 건너간다
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, Icon, ICONS, enter, ratio } from "../theme";

const BAR_W = 1520;

export const Switcher: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text, alignItems: "center", paddingTop: 168 }}>
      <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: "-0.02em", ...enter(frame, 0) }}>
        사이트끼리 <span style={{ color: C.accentText }}>한 번에</span>
      </div>
      <div style={{ fontSize: 46, fontWeight: 700, color: C.muted, marginTop: 22, ...enter(frame, 10) }}>
        어느 화면에서든 머리 위 줄을 누르면 바로 건너갑니다
      </div>

      <div
        style={{
          marginTop: 104,
          width: BAR_W,
          height: Math.round(BAR_W * ratio("switcher")),
          borderRadius: 26,
          overflow: "hidden",
          background: C.panel,
          boxShadow: `0 26px 60px rgba(21,36,71,0.18), 0 0 0 ${4 + 3 * glow}px rgba(255,183,3,${0.35 + 0.35 * glow})`,
          ...enter(frame, 20, 22, 34),
        }}
      >
        <Img src={staticFile("shots/switcher.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      <div
        style={{
          marginTop: 86,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 46,
          fontWeight: 800,
          color: C.text,
          background: C.panel,
          padding: "20px 42px",
          borderRadius: 999,
          boxShadow: "0 14px 34px rgba(21,36,71,0.10)",
          opacity: interpolate(frame, [52, 68], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <Icon paths={ICONS.home} size={48} color={C.accentText} stroke={2.4} />
        맨 끝 <b style={{ color: C.accentText, fontWeight: 900 }}>[전체 보기]</b> 를 누르면 모아보기로
      </div>

      {/* 띠가 떠오를 때 한 번 '딸깍' */}
      <Sequence from={22} layout="none">
        <Audio src={staticFile("sfx/mouse-click.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
