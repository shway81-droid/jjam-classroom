import { bench, ellipse } from './lib.mjs';

// ================================================================ 아이스크림 — 참조: refs/ice-cream.png
// 콘을 먼저 긋고 그 위에 아이스크림을 쌓습니다. 왼쪽 동그라미가 앞, 오른쪽 동그라미는 그 뒤에 숨고,
// 아래 넓은 아이스크림은 두 동그라미와 콘 사이로 양옆만 보입니다.
// 콘 무늬의 줄은 모두 양 끝이 콘 테두리 위에 놓입니다(떠 있는 획 없음).

const TL = [137, 272]; const TR = [261, 272]; const TIP = [199, 448];

// 콘 세모 안에서 점 p 를 지나 방향 v 로 뻗는 줄의 양 끝
function across(p, v) {
  const edges = [[TL, TR], [TR, TIP], [TIP, TL]];
  const hits = [];
  for (const [a, b] of edges) {
    const ex = b[0] - a[0]; const ey = b[1] - a[1];
    const den = v[0] * ey - v[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den;
    const s = ((a[0] - p[0]) * v[1] - (a[1] - p[1]) * v[0]) / den;
    if (s >= 0 && s <= 1) hits.push([p[0] + v[0] * t, p[1] + v[1] * t, t]);
  }
  hits.sort((x, y) => x[2] - y[2]);
  return [hits[0].slice(0, 2), hits[hits.length - 1].slice(0, 2)];
}

export default function draw() {
  const b = bench();
  const cone = b.closed('cone', [
    TL, [168, 278], [199, 280], [230, 278], TR, [230, 360], TIP, [168, 360],
  ], 0.45);
  b.step('콘', '종이 아래쪽에 위가 넓고 끝이 뾰족한 콘을 그려요.', cone);

  const k = 1.15;
  const lines = [];
  for (const [y, dir] of [[292, 1], [348, 1], [404, 1], [318, -1], [376, -1]]) {
    const [a, c] = across([199, y], [dir, k]);
    lines.push(b.open(`l${y}`, [a, c], ['cone', 'cone']));
  }
  b.step('콘 무늬', '콘에 엇갈린 줄을 그어 그물 무늬를 넣어요.', ...lines);

  const scoopL = b.closed('scoopL', ellipse(165, 200, 51, 45, 12));
  b.step('앞 아이스크림', '콘 위에 동그란 아이스크림을 하나 그려요.', scoopL);

  const scoopR = b.open('scoopR', [
    [207, 172], [226, 157], [252, 152], [276, 162], [289, 190], [285, 220], [266, 236], [238, 240], [212, 234], [203, 226],
  ], ['scoopL', 'scoopL']);
  b.step('뒤 아이스크림', '그 옆에 뒤로 살짝 숨은 아이스크림을 하나 더 그려요.', scoopR);

  const baseL = b.open('baseL', [TL, [124, 257], [118, 240], [123, 226]], ['cone', 'scoopL']);
  const baseR = b.open('baseR', [TR, [276, 257], [282, 240], [282, 228]], ['cone', 'scoopR']);
  b.step('아래 아이스크림', '두 아이스크림 아래 양옆에 넓은 아이스크림을 그려요.', baseL, baseR);

  const swirl = b.open('swirl', [
    [146, 160], [138, 138], [146, 116], [170, 101], [194, 88], [205, 68], [210, 52],
    [219, 64], [228, 86], [248, 104], [259, 126], [255, 146], [244, 156],
  ], ['scoopL', 'scoopR']);
  b.step('뾰족한 꼭대기', '맨 위에 끝이 뾰족하게 말려 올라간 크림을 그려요.', swirl);

  const curl = b.open('curl', [[150, 122], [180, 128], [214, 120], [238, 106], [246, 104]], ['swirl', 'swirl']);
  const shine = b.closed('shine', [[132, 192], [136, 176], [148, 167], [156, 166], [150, 175], [140, 192]], 0.7);
  b.step('물결과 반짝이', '크림에 물결 줄을 하나 긋고 아이스크림에 반짝이를 넣어요.', curl, shine);

  return {
    id: 'ice-cream', title: '아이스크림', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데 아래쪽에 손바닥만큼 콘부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['음식', '아이스크림', '여름'],
  };
}
