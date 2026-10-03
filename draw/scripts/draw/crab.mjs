import { bench, ellipse } from './lib.mjs';

// ================================================================ 꽃게 — 참조 없음(직접 디자인), 앞에서 본 모습
// 넓적한 몸을 먼저 긋고, 집게를 그린 다음 팔로 몸과 잇습니다. 다리는 가는 관 모양 한 획입니다.
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
const mirror = (pts) => pts.map(([x, y]) => [500 - x, y]);

export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(250, 240, 130, 85, 14));
  b.step('넓은 몸', '종이 가운데에 옆으로 넓적한 몸을 그려요.', body);

  const eyeL = b.closed('eyeL', ellipse(215, 104, 16, 16));
  const eyeR = b.closed('eyeR', ellipse(285, 104, 16, 16));
  const stalkL = b.open('stalkL', [[215, 160], [214, 140], [215, 120]], ['body', 'eyeL']);
  const stalkR = b.open('stalkR', [[285, 160], [286, 140], [285, 120]], ['body', 'eyeR']);
  b.step('눈', '몸 위로 막대 끝에 달린 동그란 눈을 두 개 그려요.', eyeL, eyeR, stalkL, stalkR);

  const pL = b.closed('pL', ellipse(219, 106, 6, 7));
  const pR = b.closed('pR', ellipse(281, 106, 6, 7));
  b.step('눈동자', '눈 안에 작은 눈동자를 하나씩 그려요.', pL, pR);

  const claw = [[60, 140], [42, 110], [48, 76], [74, 56], [104, 62], [94, 84], [78, 90], [92, 100], [114, 94], [110, 124], [90, 142]];
  const clawL = b.closed('clawL', claw, 0.8);
  const clawR = b.closed('clawR', mirror(claw), 0.8);
  b.step('집게', '몸 양쪽 위에 끝이 벌어진 큰 집게를 그려요.', clawL, clawR);

  const armL = b.open('armL', [[132, 200], [106, 180], [92, 150]], ['body', 'clawL']);
  const armR = b.open('armR', [[368, 200], [394, 180], [408, 150]], ['body', 'clawR']);
  b.step('팔', '몸에서 집게까지 팔을 하나씩 이어 그려요.', armL, armR);

  const legs = [[[126, 260], [95, 270], [70, 300]], [[136, 284], [105, 305], [90, 340]], [[158, 304], [135, 335], [130, 370]]];
  const left = legs.map((c, i) => b.open(`lL${i}`, tube(c, 6), ['body', 'body']));
  b.step('왼쪽 다리', '몸 왼쪽 아래에 가느다란 다리를 세 개 그려요.', ...left);

  const right = legs.map((c, i) => b.open(`lR${i}`, tube(mirror(c), 6), ['body', 'body']));
  b.step('오른쪽 다리', '몸 오른쪽 아래에도 다리를 세 개 그려요.', ...right);

  const mouth = b.closed('mouth', [[228, 266], [250, 274], [272, 266], [266, 280], [250, 287], [234, 280]], 0.8);
  b.step('웃는 입', '몸 가운데 아래쪽에 방긋 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(200, 262, 14, 9));
  const cheekR = b.closed('cheekR', ellipse(300, 262, 14, 9));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'crab', title: '꽃게', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 넓적한 몸부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '바다', '갯벌'],
  };
}
