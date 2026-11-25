// 4. 여덟 사이트를 차례로. 한 사이트에 한 칸.
//    위에는 **진짜 화면**, 아래 띠에는 아이콘·이름·한 줄·걸리는 시간·개수.
//    눌러 들어간 화면(deep)이 있는 사이트는 칸 중간에 그 화면으로 바뀐다.
import { AbsoluteFill, Img, interpolate, Series, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { SITES, type Site } from "../sites";
import { C, FONT, SiteIcon, ease, enter, ratio } from "../theme";

export const SITE_LEN = 100; // 한 사이트에 쓰는 프레임
const SWAP = 50; // 활동 화면이 올라오기 시작하는 프레임
const SWAP_DUR = 16;

const SHOT_W = 1430;
const BAND_TOP = 902; // 아래 띠가 시작하는 자리

const Card: React.FC<{ site: Site }> = ({ site }) => {
  const frame = useCurrentFrame();
  const h = Math.round(SHOT_W * ratio(site.shot));
  // 화면은 띠 위 공간(40 ~ BAND_TOP-30)의 한가운데에 놓는다 — 사이트마다 세로가 다르다.
  const top = Math.max(40, Math.round((BAND_TOP - 30 - h) / 2) + 10);
  // 활동 화면은 겹쳐 사라지게 하지 않는다 — 빽빽한 두 화면이 포개지면 고장처럼 보인다.
  // 아래에서 **밀고 올라오게** 해서 "눌러 들어갔다"가 눈에 보이게 한다.
  const swap = site.deep
    ? interpolate(frame, [SWAP, SWAP + SWAP_DUR], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })
    : 0;

  const shotStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
  };

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      <div
        style={{
          position: "absolute",
          left: (1920 - SHOT_W) / 2,
          top,
          width: SHOT_W,
          height: h,
          borderRadius: 22,
          overflow: "hidden",
          background: C.panel,
          boxShadow: "0 24px 60px rgba(21, 36, 71, 0.18), 0 0 0 2px rgba(21, 36, 71, 0.06)",
          scale: interpolate(frame, [0, SITE_LEN], [1, 1.03]),
          opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Img src={staticFile(`shots/${site.shot}.png`)} style={shotStyle} />
        {site.deep ? (
          <Img
            src={staticFile(`shots/${site.deep}.png`)}
            style={{ ...shotStyle, translate: `0px ${(1 - swap) * 100}%`, boxShadow: "0 -20px 40px rgba(21,36,71,0.16)" }}
          />
        ) : null}
      </div>

      {/* 아래 띠 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BAND_TOP,
          width: 1920,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          ...enter(frame, 6, 16, 24),
        }}
      >
        <SiteIcon site={site.key} size={96} style={{ filter: "drop-shadow(0 8px 18px rgba(21,36,71,0.18))" }} />
        <span
          style={{
            background: site.color,
            color: site.on,
            fontSize: 48,
            fontWeight: 900,
            padding: "12px 32px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {site.name}
        </span>
        <span style={{ fontSize: 52, fontWeight: 800, whiteSpace: "nowrap" }}>{site.line}</span>
        <span style={{ display: "flex", gap: 12, marginLeft: 8 }}>
          <Pill>{site.min}</Pill>
          <Pill>{site.amt}</Pill>
        </span>
      </div>

      <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      background: C.tint,
      color: C.muted,
      fontSize: 36,
      fontWeight: 800,
      padding: "12px 24px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </span>
);

export const Sites: React.FC = () => (
  <Series>
    {SITES.map((s) => (
      <Series.Sequence key={s.key} name={s.name} durationInFrames={SITE_LEN}>
        <Card site={s} />
      </Series.Sequence>
    ))}
  </Series>
);
