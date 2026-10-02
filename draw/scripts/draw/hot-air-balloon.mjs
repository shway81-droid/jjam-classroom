import { bench, ellipse } from './lib.mjs';

// ================================================================ 열기구 — 참조 없음(직접 디자인)
// 큰 풍선을 첫 획으로 긋고, 무늬는 풍선 테두리에 양 끝을 붙입니다. 줄은 풍선과 바구니를 잇습니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];
const cloud = (cx, cy) => [[cx - 40, cy + 12], [cx - 46, cy], [cx - 30, cy - 14], [cx - 12, cy - 24], [cx + 10, cy - 26], [cx + 28, cy - 14], [cx + 44, cy - 4], [cx + 42, cy + 12], [cx, cy + 14]];

export default function draw() {
  const b = bench();
  const balloon = b.closed('balloon', [[200, 40], [290, 64], [330, 140], [310, 230], [260, 300], [230, 320], [170, 320], [140, 300], [90, 230], [70, 140], [110, 64]], 0.9);
  b.step('큰 풍선', '종이 위쪽 가운데에 아래가 좁은 큰 풍선을 그려요.', balloon);

  const v1 = b.open('v1', [[200, 42], [200, 180], [200, 318]], ['balloon', 'balloon']);
  const v2 = b.open('v2', [[156, 48], [124, 170], [180, 318]], ['balloon', 'balloon']);
  const v3 = b.open('v3', [[244, 48], [276, 170], [220, 318]], ['balloon', 'balloon']);
  b.step('세로 무늬', '풍선 위에서 아래로 둥근 줄을 세 개 그어요.', v1, v2, v3);

  const band = b.open('band', [[92, 230], [200, 244], [308, 230]], ['balloon', 'balloon']);
  b.step('가로 띠', '풍선 아래쪽을 가로지르는 띠를 하나 그어요.', band);

  const basket = b.closed('basket', rect(160, 400, 240, 460), 0.2);
  b.step('바구니', '풍선 아래에 떨어뜨려서 네모난 바구니를 그려요.', basket);

  const r1 = b.open('r1', [[174, 318], [168, 360], [164, 400]], ['balloon', 'basket']);
  const r2 = b.open('r2', [[226, 318], [232, 360], [236, 400]], ['balloon', 'basket']);
  b.step('줄 두 개', '풍선과 바구니를 줄 두 개로 이어요.', r1, r2);

  const w1 = b.open('w1', [[160, 430], [200, 430], [240, 430]], ['basket', 'basket']);
  const w2 = b.open('w2', [[187, 400], [187, 460]], ['basket', 'basket']);
  const w3 = b.open('w3', [[213, 400], [213, 460]], ['basket', 'basket']);
  b.step('바구니 무늬', '바구니에 가로줄 하나와 세로줄 두 개를 그어요.', w1, w2, w3);

  const bag = b.closed('bag', [[242, 414], [256, 418], [262, 434], [252, 444], [242, 438]], 0.8);
  b.step('모래주머니', '바구니 오른쪽에 작은 모래주머니를 그려요.', bag);

  const c1 = b.closed('c1', cloud(70, 372), 0.8);
  const c2 = b.closed('c2', cloud(338, 330), 0.8);
  b.step('구름', '바구니 양옆에 몽실몽실한 구름을 그려요.', c1, c2);

  const sun = b.closed('sun', ellipse(356, 56, 24, 24, 10));
  b.step('해', '종이 오른쪽 위에 동그란 해를 그려요.', sun);

  return {
    id: 'hot-air-balloon', title: '열기구', theme: 'thing', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 종이 반만큼 큰 풍선부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['탈것', '하늘', '여행'],
  };
}
