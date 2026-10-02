import { bench, ellipse } from './lib.mjs';

// ================================================================ 막대사탕 — 참조 없음(직접 디자인)
// 큰 동그라미를 먼저 긋고, 가운데 점에서 바깥 테두리까지 빙글빙글 도는 무늬를 잇습니다.
export default function draw() {
  const b = bench();
  const candy = b.closed('candy', ellipse(200, 190, 120, 120, 12));
  b.step('큰 사탕', '종이 위쪽 가운데에 크고 동그란 사탕을 그려요.', candy);

  const stick = b.closed('stick', [[192, 309], [208, 309], [209, 384], [208, 458], [192, 458], [191, 384]], 0.3);
  b.step('막대', '사탕 아래 가운데에 길쭉한 막대를 그려요.', stick);

  const core = b.closed('core', ellipse(200, 190, 8, 8));
  b.step('가운데 점', '사탕 한가운데에 작은 점을 하나 그려요.', core);

  const turns = 2.75;
  const n = Math.round(turns * 12);
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n; const r = 8 + 92 * t; const a = t * turns * Math.PI * 2 - Math.PI / 2;
    return [200 + Math.cos(a) * r, 190 + Math.sin(a) * r];
  });
  const last = pts[pts.length - 1];
  pts.push([200 + (last[0] - 200) * 1.2, 190 + (last[1] - 190) * 1.2]);
  const swirl = b.open('swirl', pts, ['core', 'candy']);
  b.step('소용돌이', '가운데 점에서 바깥으로 빙글빙글 도는 줄을 그려요.', swirl);

  const knot = b.closed('knot', ellipse(200, 334, 11, 10));
  const bowL = b.closed('bowL', [[190, 332], [164, 314], [148, 322], [150, 346], [166, 354], [190, 338]], 0.8);
  const bowR = b.closed('bowR', [[210, 332], [236, 314], [252, 322], [250, 346], [234, 354], [210, 338]], 0.8);
  b.step('리본', '막대 위쪽에 양쪽으로 둥근 리본을 그려요.', knot, bowL, bowR);

  const tailL = b.closed('tailL', [[194, 344], [176, 378], [186, 378], [192, 390], [200, 346]], 0.5);
  const tailR = b.closed('tailR', [[206, 344], [224, 378], [214, 378], [208, 390], [200, 346]], 0.5);
  b.step('리본 끈', '리본 아래로 짧은 끈을 두 개 그려요.', tailL, tailR);

  return {
    id: 'lollipop', title: '막대사탕', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥만큼 큰 사탕부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['음식', '간식', '사탕'],
  };
}
