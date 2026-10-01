import { bench, ellipse } from './lib.mjs';

// ================================================================ 케이크 — 참조: refs/cake.png (AI 생성 선화)
// 초의 줄무늬는 초 양옆에 닿게 두 줄씩만 두고, 심지는 뺐습니다(불꽃 안에서 떠 있게 됩니다).
export default function draw() {
  const b = bench();
  // 왼쪽 옆면 가운데에서 시작해 바닥 → 오른쪽 옆면 → 둥근 윗면 → 다시 왼쪽으로 돕니다.
  const body = b.closed('body', [
    [68, 340], [72, 380], [76, 416], [140, 420], [200, 421], [260, 420],
    [324, 416], [328, 380], [334, 310], [330, 278], [312, 258], [270, 242],
    [200, 236], [130, 242], [88, 258], [70, 278], [66, 310],
  ]);
  b.step('케이크 몸통', '종이 가운데 아래쪽에 위가 둥근 큰 네모를 그려요.', body);

  const icing = b.open('icing', [
    [66, 314], [84, 318], [100, 306], [122, 314], [146, 326], [172, 320], [192, 316],
    [208, 326], [222, 332], [240, 322], [260, 308], [282, 316], [302, 316], [318, 302], [334, 308],
  ], ['body', 'body'], 0.9);
  b.step('흘러내린 크림', '몸통 위쪽에 출렁출렁 흘러내린 크림 줄을 그어요.', icing);

  const cream = b.bumps('cream', 'body', [80, 266], [320, 266], 5, 20, 1);
  b.step('위쪽 크림', '몸통 윗면을 따라 동글동글한 크림을 다섯 개 그려요.', cream);

  const beads = b.bumps('beads', 'body', [78, 417], [322, 417], 8, 18, -1);
  b.step('아래쪽 구슬', '몸통 바닥을 따라 동글동글한 구슬을 이어 그려요.', beads);

  const d1 = b.closed('d1', ellipse(110, 380, 12, 13));
  const d2 = b.closed('d2', ellipse(184, 386, 12, 13));
  const d3 = b.closed('d3', ellipse(260, 380, 12, 13));
  b.step('점무늬', '크림 아래 몸통에 동그란 점을 세 개 그려요.', d1, d2, d3);

  const candleM = b.open('candleM', [[189, 212], [188, 170], [188, 120], [212, 120], [212, 170], [211, 212]], ['cream', 'cream'], 0.5);
  b.step('가운데 초', '크림 가운데에 길쭉한 초를 하나 세워 그려요.', candleM);

  const candleL = b.open('candleL', [[143, 222], [138, 180], [133, 140], [157, 136], [161, 178], [164, 218]], ['cream', 'cream'], 0.5);
  const candleR = b.open('candleR', [[236, 218], [239, 178], [243, 136], [267, 140], [262, 180], [257, 222]], ['cream', 'cream'], 0.5);
  b.step('양옆 초 두 개', '가운데 초 양옆에 조금 짧은 초를 하나씩 그려요.', candleL, candleR);

  const s = (name, on, a, c) => b.open(name, [a, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], c], [on, on]);
  const sM1 = s('sM1', 'candleM', [188, 168], [212, 148]);
  const sM2 = s('sM2', 'candleM', [188, 208], [212, 188]);
  const sL1 = s('sL1', 'candleL', [136, 172], [159, 154]);
  const sL2 = s('sL2', 'candleL', [140, 206], [162, 188]);
  const sR1 = s('sR1', 'candleR', [240, 172], [264, 154]);
  const sR2 = s('sR2', 'candleR', [237, 206], [261, 188]);
  b.step('초 줄무늬', '초마다 비스듬한 줄무늬를 두 개씩 그어요.', sM1, sM2, sL1, sL2, sR1, sR2);

  const flame = (name, cx, by, h, w) => b.closed(name, [
    [cx, by], [cx + w * 0.8, by - h * 0.18], [cx + w, by - h * 0.42], [cx + w * 0.55, by - h * 0.72],
    [cx, by - h], [cx - w * 0.55, by - h * 0.72], [cx - w, by - h * 0.42], [cx - w * 0.8, by - h * 0.18],
  ]);
  const fM = flame('fM', 200, 120, 66, 15);
  const fL = flame('fL', 145, 138, 58, 14);
  const fR = flame('fR', 255, 138, 58, 14);
  b.step('불꽃 세 개', '초 끝마다 물방울 모양 불꽃을 하나씩 그려요.', fM, fL, fR);

  return {
    id: 'cake', title: '케이크', theme: 'food', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 아래쪽에 손바닥만큼 큰 몸통부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['음식', '케이크', '생일'],
  };
}
