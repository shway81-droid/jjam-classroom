import { bench, ellipse } from './lib.mjs';

// ================================================================ 사자 얼굴 — 참조 없음(직접 디자인)
// 물결치는 갈기를 첫 획으로 크게 긋고, 그 안에 얼굴과 주둥이를 차례로 얹습니다.
export default function draw() {
  const b = bench();
  const manePts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 140 : 166;
    return [200 + Math.cos(a) * r, 246 + Math.sin(a) * r * 0.98];
  });
  const mane = b.closed('mane', manePts);
  b.step('갈기', '종이 가운데에 물결처럼 둥글둥글한 갈기를 크게 그려요.', mane);

  const face = b.closed('face', ellipse(200, 252, 105, 100, 12));
  b.step('얼굴', '갈기 안쪽에 동그란 얼굴을 그려요.', face);

  const earL = b.open('earL', [[118, 196], [104, 164], [116, 138], [146, 140], [164, 160]], ['face', 'face']);
  const earR = b.open('earR', [[282, 196], [296, 164], [284, 138], [254, 140], [236, 160]], ['face', 'face']);
  b.step('귀 두 개', '얼굴 위쪽 양옆에 둥근 귀를 붙여 그려요.', earL, earR);

  const inL = b.closed('inL', ellipse(130, 160, 9, 9));
  const inR = b.closed('inR', ellipse(270, 160, 9, 9));
  b.step('귀 안쪽', '귀 안에 작은 동그라미를 하나씩 그려요.', inL, inR);

  const eyeL = b.closed('eyeL', ellipse(165, 226, 10, 13));
  const eyeR = b.closed('eyeR', ellipse(235, 226, 10, 13));
  b.step('눈 두 개', '얼굴 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const puffL = b.closed('puffL', ellipse(175, 306, 31, 23));
  const puffR = b.closed('puffR', ellipse(225, 306, 31, 23));
  b.step('주둥이', '눈 아래에 통통한 동그라미 두 개를 나란히 그려요.', puffL, puffR);

  const nose = b.closed('nose', [[180, 254], [200, 250], [220, 254], [213, 269], [200, 277], [187, 269]], 0.8);
  b.step('코', '주둥이 위 가운데에 둥근 코를 그려요.', nose);

  const chin = b.closed('chin', ellipse(200, 340, 15, 10));
  b.step('턱', '주둥이 아래에 작고 동그란 턱을 그려요.', chin);

  const dots = [[160, 300], [176, 312], [162, 318], [240, 300], [224, 312], [238, 318]]
    .map(([x, y], i) => b.closed(`d${i}`, ellipse(x, y, 3.5, 3.5, 6)));
  b.step('수염 점', '주둥이 양쪽에 작은 점을 세 개씩 그려요.', ...dots);

  const cheekL = b.closed('cheekL', ellipse(128, 282, 14, 9));
  const cheekR = b.closed('cheekR', ellipse(272, 282, 14, 9));
  b.step('볼 두 개', '주둥이 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'lion', title: '사자 얼굴', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 종이를 거의 채우는 갈기부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '사자', '얼굴'],
  };
}
