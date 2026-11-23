// 3. 여덟 가지: 모아보기 한 화면에 전부 — 아이콘이 차례로 통통 올라온다
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { SITES } from "../sites";
import { C, FONT, Shot, SiteIcon, enter } from "../theme";

const ICON = 112;
const GAP = 26;
const POP_AT = 34; // 첫 아이콘이 올라오는 프레임
const POP_GAP = 7;

export const Eight: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      {/* 왼쪽: 글과 아이콘 여덟 */}
      <div style={{ position: "absolute", left: 96, top: 232, width: 580 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.accentText, ...enter(frame, 0) }}>모아보기 한 화면에</div>
        <div style={{ marginTop: 20, fontSize: 104, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, ...enter(frame, 6) }}>
          짬짬이
          <br />
          여덟 가지
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: GAP, width: ICON * 4 + GAP * 3, marginTop: 48 }}>
          {SITES.map((s, i) => {
            const at = POP_AT + i * POP_GAP;
            const t = interpolate(frame, [at, at + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            return (
              <SiteIcon
                key={s.key}
                site={s.key}
                size={ICON}
                style={{
                  opacity: t,
                  scale: interpolate(t, [0, 1], [0.4, 1]),
                  filter: "drop-shadow(0 10px 22px rgba(21,36,71,0.18))",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 진짜 모아보기 화면 */}
      <div style={{ position: "absolute", left: 736, top: 0, height: 1080, display: "flex", alignItems: "center", ...enter(frame, 10, 22, 34) }}>
        <Shot name="home" width={1110} />
      </div>

      <Sequence from={POP_AT} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};
