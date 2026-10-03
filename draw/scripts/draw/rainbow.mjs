import { bench, ellipse } from './lib.mjs';

// ================================================================ 무지개 — 참조 없음(직접 디자인)
// 무지개 바깥 테두리를 닫힌 한 획으로 긋고, 가운데 줄과 구름은 그 테두리 위에 양 끝을 붙입니다.
const arc = (r, from, to, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
  return [250 + Math.cos(a) * r, 320 + Math.sin(a) * r];
});

export default function draw() {
  const b = bench();
  const bow = b.closed('bow', [...arc(190, 180, 360), ...arc(100, 360, 180)], 0.5);
  b.step('무지개', '종이 가운데에 커다란 무지개 띠를 그려요.', bow);

  const a1 = b.open('a1', arc(160, 180, 360), ['bow', 'bow']);
  const a2 = b.open('a2', arc(130, 180, 360), ['bow', 'bow']);
  b.step('무지개 줄', '무지개 띠 안에 둥근 줄을 두 개 그어요.', a1, a2);

  const cL = b.open('cL', [[60, 320], [34, 334], [30, 360], [56, 380], [100, 384], [140, 380], [166, 362], [164, 338], [150, 320]], ['bow', 'bow']);
  b.step('왼쪽 구름', '무지개 왼쪽 끝을 감싸는 구름을 그려요.', cL);

  const cR = b.open('cR', [[350, 320], [336, 338], [334, 362], [360, 380], [400, 384], [444, 380], [470, 360], [466, 334], [440, 320]], ['bow', 'bow']);
  b.step('오른쪽 구름', '무지개 오른쪽 끝에도 구름을 그려요.', cR);

  const sun = b.closed('sun', ellipse(66, 76, 28, 28, 10));
  b.step('해', '종이 왼쪽 위에 동그란 해를 그려요.', sun);

  const bird = b.closed('bird', [[396, 92], [412, 80], [428, 92], [444, 80], [460, 92], [444, 88], [428, 98], [412, 88]], 0.6);
  b.step('새', '종이 오른쪽 위에 날아가는 새를 그려요.', bird);

  return {
    id: 'rainbow', title: '무지개', theme: 'season', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 종이를 가로지르는 무지개부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['날씨', '하늘', '비'],
  };
}
