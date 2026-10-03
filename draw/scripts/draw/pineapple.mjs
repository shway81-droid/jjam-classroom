import { bench, ellipse } from './lib.mjs';

// ================================================================ 파인애플 — 참조 없음(직접 디자인)
// 둥근 몸을 먼저 긋고 뾰족한 잎을 얹습니다. 빗금은 몸 테두리 위에서 시작하고 끝나는 곧은 줄입니다.
const C = [200, 320]; const RX = 100; const RY = 130;
// 기울기 dir(+1 '\', -1 '/'), 몸 가운데에서 떨어진 거리 off 인 줄이 몸 테두리와 만나는 두 점
const chord = (dir, off) => {
  const ux = Math.SQRT1_2; const uy = dir * Math.SQRT1_2; // 줄 방향
  const nx = -uy; const ny = ux; // 줄에 수직
  const px = C[0] + nx * off; const py = C[1] + ny * off;
  const A = (ux * ux) / (RX * RX) + (uy * uy) / (RY * RY);
  const B = 2 * (((px - C[0]) * ux) / (RX * RX) + ((py - C[1]) * uy) / (RY * RY));
  const K = ((px - C[0]) ** 2) / (RX * RX) + ((py - C[1]) ** 2) / (RY * RY) - 1;
  const d = Math.sqrt(B * B - 4 * A * K);
  const t1 = (-B - d) / (2 * A); const t2 = (-B + d) / (2 * A);
  return [[px + ux * t1, py + uy * t1], [px + ux * t2, py + uy * t2]];
};

export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(C[0], C[1], RX, RY, 14));
  b.step('파인애플 몸', '종이 아래쪽 가운데에 위아래로 긴 둥근 몸을 그려요.', body);

  const lc = b.closed('lc', [[186, 196], [180, 130], [200, 50], [220, 130], [214, 196]], 0.7);
  b.step('가운데 잎', '몸 위 가운데에 길고 뾰족한 잎을 그려요.', lc);

  const ll = b.closed('ll', [[176, 198], [146, 150], [122, 92], [166, 128], [194, 192]], 0.7);
  const lr = b.closed('lr', [[224, 198], [254, 150], [278, 92], [234, 128], [206, 192]], 0.7);
  b.step('안쪽 잎', '가운데 잎 양옆에 뾰족한 잎을 하나씩 그려요.', ll, lr);

  const ol = b.closed('ol', [[166, 204], [120, 186], [88, 156], [138, 164], [180, 196]], 0.7);
  const or = b.closed('or', [[234, 204], [280, 186], [312, 156], [262, 164], [220, 196]], 0.7);
  b.step('바깥 잎', '바깥쪽에 조금 짧은 잎을 하나씩 더 그려요.', ol, or);

  const offs = [-70, -24, 24, 70];
  const d1 = offs.map((o, i) => b.open(`a${i}`, chord(1, o), ['body', 'body'], 0));
  b.step('빗금', '몸에 한쪽으로 기운 빗금을 네 줄 그어요.', ...d1);

  const d2 = offs.map((o, i) => b.open(`b${i}`, chord(-1, o), ['body', 'body'], 0));
  b.step('반대 빗금', '반대쪽으로 기운 빗금을 네 줄 더 그어 칸을 만들어요.', ...d2);

  // 칸 가운데 점 — 두 방향 빗금 사이의 한가운데
  const cells = [];
  for (const u of [-47, 0, 47]) for (const v of [-47, 0, 47]) {
    const x = C[0] + (u - v) * Math.SQRT1_2; const y = C[1] + (u + v) * Math.SQRT1_2;
    cells.push([x, y]);
  }
  const dotsA = cells.slice(0, 5).map(([x, y], i) => b.closed(`p${i}`, ellipse(x, y, 4.5, 4.5, 6)));
  b.step('씨 점', '칸 몇 개 가운데에 작은 점을 그려요.', ...dotsA);

  const dotsB = cells.slice(5).map(([x, y], i) => b.closed(`q${i}`, ellipse(x, y, 4.5, 4.5, 6)));
  b.step('씨 점 더', '나머지 칸에도 작은 점을 그려요.', ...dotsB);

  const vein = b.open('vein', [[200, 190], [200, 130], [200, 64]], ['lc', 'lc']);
  b.step('잎맥', '가운데 잎에 잎맥을 하나 그어요.', vein);

  return {
    id: 'pineapple', title: '파인애플', theme: 'food', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 아래쪽에 손바닥만큼 큰 몸부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['과일', '음식', '여름'],
  };
}
