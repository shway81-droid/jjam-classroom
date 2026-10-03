import { bench, ellipse } from './lib.mjs';

// ================================================================ 웃는 해 — 참조 없음(직접 디자인)
// 동그란 해를 먼저 긋고, 햇살은 해 둘레에 떨어뜨린 작은 세모로 그립니다.
const ray = (deg) => {
  const a = (deg * Math.PI) / 180; const w = (11 * Math.PI) / 180;
  const p = (r, t) => [200 + Math.cos(t) * r, 240 + Math.sin(t) * r];
  return [p(116, a - w), p(162, a), p(116, a + w)];
};

export default function draw() {
  const b = bench();
  const sun = b.closed('sun', ellipse(200, 240, 100, 100, 14));
  b.step('해', '종이 가운데에 크고 동그란 해를 그려요.', sun);

  const r1 = [270, 0, 90, 180].map((d) => b.closed(`r${d}`, ray(d), 0.2));
  b.step('햇살', '해 위아래와 양옆에 뾰족한 햇살을 그려요.', ...r1);

  const r2 = [315, 45, 135, 225].map((d) => b.closed(`r${d}`, ray(d), 0.2));
  b.step('햇살 더', '햇살 사이사이에 햇살을 네 개 더 그려요.', ...r2);

  const eyeL = b.closed('eyeL', ellipse(166, 222, 10, 14));
  const eyeR = b.closed('eyeR', ellipse(234, 222, 10, 14));
  b.step('눈 두 개', '해 가운데 위쪽에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[168, 268], [200, 278], [232, 268], [224, 292], [200, 302], [176, 292]], 0.8);
  b.step('웃는 입', '눈 아래에 크게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(136, 256, 13, 8));
  const cheekR = b.closed('cheekR', ellipse(264, 256, 13, 8));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'sun-face', title: '웃는 해', theme: 'season', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 해부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['날씨', '여름', '하늘'],
  };
}
