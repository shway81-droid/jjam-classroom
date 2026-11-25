// 짬짬이 교실 소개 영상의 색·글꼴·공통 조각.
// 색은 모아보기(home/index.html 의 :root)와 같은 값을 쓴다 — 영상과 사이트가 따로 놀지 않게.
import { loadFont } from "@remotion/fonts";
import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import shots from "../public/shots/shots.json";

export const C = {
  bg: "#F4F6FA", // --ground
  panel: "#FFFFFF", // --paper
  tint: "#E9EDF5", // --tint
  line: "#DCE1EC", // --line
  text: "#152447", // --ink
  muted: "#55607A", // --ink-soft
  hero: "#152447", // --hero (머리띠)
  accent: "#FFB703", // --highlight
  accentSoft: "#FFF4D6",
  accentText: "#A86A00", // 밝은 바탕 위의 노랑 글자용
};

export const FONT = "Pretendard";
export const FPS = 30;

const WEIGHTS: [string, string][] = [
  ["500", "Medium"],
  ["600", "SemiBold"],
  ["700", "Bold"],
  ["800", "ExtraBold"],
  ["900", "Black"],
];

export const fontsReady = Promise.all(
  WEIGHTS.map(([weight, name]) => loadFont({ family: FONT, url: staticFile(`fonts/Pretendard-${name}.woff2`), weight })),
);

/** 0→1 로 부드럽게(앞이 빠르고 끝이 느림) */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** 들어오기: 아래에서 살짝 올라오며 나타난다 */
export function enter(frame: number, at: number, dur = 18, dist = 40) {
  const t = interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { opacity: t, translate: `0px ${(1 - t) * dist}px` };
}

/** 찍어 둔 화면의 실제 크기(가로:세로). 사이트마다 다르다 — scripts/capture.mjs 가 재서 남긴다. */
export function ratio(name: string) {
  const s = (shots as Record<string, { w: number; h: number }>)[name];
  if (!s) throw new Error(`public/shots/shots.json 에 '${name}' 이 없습니다. npm run prep 을 다시 돌리세요.`);
  return s.h / s.w;
}

/** 찍어 둔 사이트 화면을 둥근 테두리 안에 */
export const Shot: React.FC<{ name: string; width: number; style?: React.CSSProperties; radius?: number }> = ({
  name,
  width,
  style,
  radius = 22,
}) => (
  <div
    style={{
      width,
      height: Math.round(width * ratio(name)),
      borderRadius: radius,
      overflow: "hidden",
      boxShadow: "0 24px 60px rgba(21, 36, 71, 0.18), 0 0 0 2px rgba(21, 36, 71, 0.06)",
      background: C.panel,
      ...style,
    }}
  >
    <Img src={staticFile(`shots/${name}.png`)} style={{ width: "100%", height: "100%", display: "block" }} />
  </div>
);

/** 여덟 사이트 아이콘 (모아보기의 SVG 를 480px 로 찍어 둔 것) */
export const SiteIcon: React.FC<{ site: string; size: number; style?: React.CSSProperties }> = ({ site, size, style }) => (
  <Img src={staticFile(`shots/icon-${site}.png`)} style={{ width: size, height: size, display: "block", ...style }} />
);

/** 짬짬이 교실 로고 (home/favicon.svg) */
export const Logo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={staticFile("logo.svg")} style={{ width: size, height: size, display: "block", ...style }} />
);

/** 루시드 아이콘(선 그림). d 는 path 들의 d 값 */
export const Icon: React.FC<{ paths: string[]; size: number; color: string; stroke?: number }> = ({ paths, size, color, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

export const ICONS = {
  heart: [
    "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 0L5 15c-1.5-1.5-3-3.21-3-5.5",
  ],
  click: [
    "M14 4.1 12 6",
    "m5.1 8-2.9-.8",
    "m6 12-1.9 2",
    "M7.2 2.2 8 5.1",
    "M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z",
  ],
  unlock: [
    "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z",
    "M8 11V7a4 4 0 0 1 7.5-2",
  ],
  monitor: ["M9 21h6", "M12 17v4", "M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"],
  arrows: ["M8 7 3 12l5 5", "M16 7l5 5-5 5", "M3 12h18"],
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"],
};
