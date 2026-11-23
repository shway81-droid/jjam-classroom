// 여덟 사이트. **글귀와 개수는 여기에 적지 않는다** — scripts/sites.mjs 가 모아보기
// (home/index.html)에서 읽어 public/sites.json 에 넣어 둔 것을 그대로 쓴다.
// 여기서 정하는 것은 영상에만 있는 것뿐이다: 띠 색, 어떤 화면을 띄울지.
import raw from "../public/sites.json";

export type Site = {
  key: string;
  url: string;
  name: string; // 짬짬이 게임
  line: string; // 전자칠판으로 즐기는 미니게임
  min: string; // 3~10분
  amt: string; // 미니게임 105
  color: string; // 아이콘 색 (모아보기와 같다)
  on: string; // 그 색 위에 올릴 글자색
  shot: string; // 첫 화면
  deep?: string; // 눌러 들어간 화면 (있으면 장면 중간에 바뀐다)
};

// 색은 모아보기 아이콘(home/index.html 의 <symbol>)에서 쓰는 것과 같다.
// `on` 은 그 색 위에 올릴 글자색 — 노랑·하늘은 흰 글자가 읽히지 않아 먹색을 쓴다.
const LOOK: Record<string, Pick<Site, "color" | "on" | "shot"> & { deep?: string }> = {
  game: { color: "#FFB703", on: "#152447", shot: "game", deep: "game-play" },
  quiz: { color: "#12A57C", on: "#FFFFFF", shot: "quiz" },
  word: { color: "#E4576E", on: "#FFFFFF", shot: "word", deep: "word-play" },
  story: { color: "#6145B5", on: "#FFFFFF", shot: "story" },
  video: { color: "#4FA8E8", on: "#152447", shot: "video" },
  "1min": { color: "#E8590C", on: "#FFFFFF", shot: "1min" },
  draw: { color: "#E4572E", on: "#FFFFFF", shot: "draw", deep: "draw-step" },
  picturebook: { color: "#6A9A1F", on: "#FFFFFF", shot: "picturebook", deep: "book-page" },
};

export const SITES: Site[] = (raw as Omit<Site, "color" | "on" | "shot" | "deep">[]).map((s) => {
  const look = LOOK[s.key];
  if (!look) throw new Error(`'${s.key}' 사이트의 색·화면이 src/sites.ts 에 없습니다. 모아보기에 사이트가 늘었나요?`);
  return { ...s, ...look };
});

if (SITES.length !== 8) {
  throw new Error(`여덟 사이트가 와야 하는데 ${SITES.length}개입니다. npm run prep 을 다시 돌리세요.`);
}
