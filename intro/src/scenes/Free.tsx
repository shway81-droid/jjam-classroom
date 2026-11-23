// 6. 약속 네 가지 — 모아보기 아래 줄(.promise)에 적힌 그대로
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, Icon, ICONS, enter } from "../theme";

const CARDS = [
  { icon: ICONS.heart, title: "모두 무료", sub: "끝까지 공짜" },
  { icon: ICONS.click, title: "설치 없음", sub: "크롬·엣지에서 바로" },
  { icon: ICONS.unlock, title: "로그인 없음", sub: "가입도 계정도 없이" },
  { icon: ICONS.monitor, title: "큰 화면", sub: "전자칠판에 맞춰" },
];

export const Free: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text, alignItems: "center", paddingTop: 170 }}>
      <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: "-0.02em", ...enter(frame, 0) }}>어느 교실에서든</div>
      <div style={{ display: "flex", gap: 36, marginTop: 118 }}>
        {CARDS.map((c, i) => (
          <div
            key={c.title}
            style={{
              width: 414,
              padding: "62px 24px 54px",
              borderRadius: 32,
              background: C.panel,
              boxShadow: "0 18px 44px rgba(21, 36, 71, 0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              ...enter(frame, 14 + i * 10),
            }}
          >
            <div
              style={{
                width: 152,
                height: 152,
                borderRadius: 99,
                background: C.accentSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon paths={c.icon} size={86} color={C.accentText} stroke={2} />
            </div>
            <div style={{ fontSize: 60, fontWeight: 900, whiteSpace: "nowrap" }}>{c.title}</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: C.muted, whiteSpace: "nowrap" }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
