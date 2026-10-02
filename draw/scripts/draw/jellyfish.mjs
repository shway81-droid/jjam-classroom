import { bench, ellipse } from './lib.mjs';

// ================================================================ 해파리 — 참조 없음(직접 디자인)
// 둥근 머리를 먼저 긋고, 다리는 가는 관 모양 한 획으로 그어 양 끝을 머리 아래에 붙입니다.
const tube = (c, w) => {
  const side = (k) => c.map((p, i) => {
    const a = c[Math.max(0, i - 1)]; const z = c[Math.min(c.length - 1, i + 1)];
    const tx = z[0] - a[0]; const ty = z[1] - a[1]; const l = Math.hypot(tx, ty);
    return [p[0] + (-ty / l) * w * k, p[1] + (tx / l) * w * k];
  });
  const L = side(1); const R = side(-1); const n = c.length - 1;
  const tx = c[n][0] - c[n - 1][0]; const ty = c[n][1] - c[n - 1][1]; const l = Math.hypot(tx, ty);
  const cap = [c[n][0] + (tx / l) * w, c[n][1] + (ty / l) * w];
  return [...L, cap, ...R.reverse()];
};

export default function draw() {
  const b = bench();
  const dome = b.closed('dome', [
    [88, 240], [96, 160], [138, 104], [200, 82], [262, 104], [304, 160], [312, 240],
    [284, 252], [256, 240], [228, 254], [200, 242], [172, 254], [144, 240], [116, 252],
  ], 0.9);
  b.step('둥근 머리', '종이 위쪽에 아래가 물결인 둥근 머리를 그려요.', dome);

  const eyeL = b.closed('eyeL', ellipse(165, 180, 9, 12));
  const eyeR = b.closed('eyeR', ellipse(235, 180, 9, 12));
  b.step('눈 두 개', '머리 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[184, 204], [200, 210], [216, 204], [211, 216], [200, 221], [189, 216]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 방긋 웃는 입을 그려요.', mouth);

  const c1 = b.open('c1', tube([[172, 250], [160, 300], [180, 350], [160, 400], [174, 448]], 7), ['dome', 'dome']);
  const c2 = b.open('c2', tube([[228, 250], [240, 300], [220, 350], [240, 400], [226, 448]], 7), ['dome', 'dome']);
  b.step('긴 다리', '머리 아래 가운데에 구불구불한 긴 다리를 두 개 그려요.', c1, c2);

  const c3 = b.open('c3', tube([[118, 248], [102, 290], [122, 330], [106, 372]], 7), ['dome', 'dome']);
  const c4 = b.open('c4', tube([[282, 248], [298, 290], [278, 330], [294, 372]], 7), ['dome', 'dome']);
  b.step('짧은 다리', '양쪽 바깥에 조금 짧은 다리를 하나씩 그려요.', c3, c4);

  const cheekL = b.closed('cheekL', ellipse(136, 206, 14, 8));
  const cheekR = b.closed('cheekR', ellipse(264, 206, 14, 8));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const bub = [[334, 112, 11], [352, 72, 8], [322, 50, 5]].map(([x, y, r], i) => b.closed(`bub${i}`, ellipse(x, y, r, r)));
  b.step('물방울', '머리 오른쪽 위에 작은 물방울을 세 개 그려요.', ...bub);

  return {
    id: 'jellyfish', title: '해파리', theme: 'animal', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥만큼 큰 머리부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '바다', '여름'],
  };
}
