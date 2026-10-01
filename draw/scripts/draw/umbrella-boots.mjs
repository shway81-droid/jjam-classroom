import { bench, ellipse } from './lib.mjs';

// ================================================================ 우산과 장화 — 참조: refs/umbrella-boots.png (AI 생성 선화)
// 우산 안쪽의 뒷면 테두리와 살 끝의 겹친 줄은 빼고, 아래 가장자리의 물결과 살 네 개만 남겼습니다.
// 우산대는 장화 두 짝 입구 사이에 닿고, 장화 밑에 물웅덩이·우산 위에 빗방울을 더했습니다.
const mirror = (pts) => pts.map(([x, y]) => [400 - x, y]).reverse();
const tips = [[48, 170], [92, 195], [150, 206], [250, 206], [308, 195], [352, 170]];
const sag = [11, 13, 15, 13, 11];

// 오른쪽 끝에서 왼쪽 끝으로, 살 끝 사이마다 위로 오목하게 파인 물결을 이어 갑니다.
const scallops = () => {
  const out = [];
  for (let i = tips.length - 1; i > 0; i--) {
    const [a, c] = [tips[i], tips[i - 1]];
    out.push(a);
    for (const t of [0.25, 0.5, 0.75]) {
      out.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - Math.sin(Math.PI * t) * sag[i - 1]]);
    }
  }
  out.push(tips[0]);
  return out;
};

const drop = (cx, cy, h, w) => [
  [cx, cy - h], [cx + w * 0.45, cy - h * 0.35], [cx + w, cy + h * 0.15], [cx + w * 0.75, cy + h * 0.5],
  [cx, cy + h * 0.62], [cx - w * 0.75, cy + h * 0.5], [cx - w, cy + h * 0.15], [cx - w * 0.45, cy - h * 0.35],
];

export default function draw() {
  const b = bench();
  const canopy = b.closed('canopy', [
    [62, 140], [92, 106], [140, 78], [200, 64], [260, 78], [308, 106], [338, 140],
    ...scallops(),
  ], 0.75);
  const pole = b.open('pole', [[195, 195], [195, 250], [195, 304], [200, 310], [205, 304], [205, 250], [205, 195]], ['canopy', 'canopy'], 0.6);
  b.step('우산', '종이 위쪽에 큰 우산을 그리고 아래로 긴 막대를 그어요.', canopy, pole);

  const knob = b.closed('knob', ellipse(200, 54, 9, 9));
  b.step('꼭지', '우산 꼭대기에 작은 동그라미를 올려 그려요.', knob);

  const ribIn = [[200, 66], [176, 98], [158, 140], [150, 206]];
  const ribL = b.open('ribL', ribIn, ['canopy', 'canopy']);
  const ribR = b.open('ribR', mirror(ribIn), ['canopy', 'canopy']);
  b.step('가운데 우산살', '꼭지에서 물결 끝까지 우산살을 두 개 그어요.', ribL, ribR);

  const ribOut = [[198, 66], [150, 86], [110, 130], [92, 195]];
  const ribLL = b.open('ribLL', ribOut, ['canopy', 'canopy']);
  const ribRR = b.open('ribRR', mirror(ribOut), ['canopy', 'canopy']);
  b.step('바깥 우산살', '그 바깥쪽에도 우산살을 하나씩 더 그어요.', ribLL, ribRR);

  const bootPts = [
    [142, 320], [154, 323], [166, 324], [178, 323], [190, 320], [189, 360], [190, 400], [192, 428], [190, 446],
    [160, 449], [128, 447], [120, 434], [126, 416], [144, 404], [150, 380], [146, 346],
  ];
  const bootL = b.closed('bootL', bootPts, 0.8);
  const bootR = b.closed('bootR', bootPts.map(([x, y]) => [400 - x, y]), 0.8);
  b.step('장화 두 짝', '막대 끝 아래 양옆에 앞코가 둥근 장화를 한 짝씩 그려요.', bootL, bootR);

  const rimL = b.open('rimL', [[142, 320], [152, 313], [166, 310], [180, 313], [190, 320]], ['bootL', 'bootL']);
  const rimR = b.open('rimR', [[210, 320], [220, 313], [234, 310], [248, 313], [258, 320]], ['bootR', 'bootR']);
  b.step('장화 입구', '장화 위쪽에 둥근 입구를 하나씩 덮어 그려요.', rimL, rimR);

  const soleL = b.open('soleL', [[121, 434], [156, 436], [191, 434]], ['bootL', 'bootL']);
  const soleR = b.open('soleR', [[209, 434], [244, 436], [279, 434]], ['bootR', 'bootR']);
  b.step('장화 밑창', '장화 아래쪽에 밑창 줄을 하나씩 그어요.', soleL, soleR);

  const puddle = b.open('puddle', [
    [122, 441], [100, 448], [88, 460], [110, 471], [160, 475], [240, 475],
    [290, 471], [312, 460], [300, 448], [278, 441],
  ], ['bootL', 'bootR']);
  b.step('물웅덩이', '장화 밑에 납작한 물웅덩이를 그려요.', puddle);

  const r1 = b.closed('r1', drop(56, 64, 18, 10));
  const r2 = b.closed('r2', drop(104, 40, 14, 8));
  const r3 = b.closed('r3', drop(296, 40, 14, 8));
  const r4 = b.closed('r4', drop(344, 64, 18, 10));
  b.step('빗방울', '우산 위 양쪽에 빗방울을 두 개씩 그려요.', r1, r2, r3, r4);

  return {
    id: 'umbrella-boots', title: '우산과 장화', theme: 'season', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥만큼 큰 우산부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['비', '우산', '장화'],
  };
}
