import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 꼬마 유령 — 참조 없음(직접 디자인), 무섭지 않고 귀엽게
// 위가 둥글고 아래가 물결인 몸을 첫 획으로, 팔은 양 끝이 몸에 붙는 열린 획입니다.
export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [200, 90], [270, 104], [316, 150], [330, 220], [332, 300], [336, 380], [326, 420],
    [296, 404], [268, 432], [240, 406], [212, 432], [184, 406], [156, 432], [128, 406],
    [98, 420], [66, 380], [68, 300], [70, 220], [84, 150], [130, 104],
  ], 0.8);
  b.step('둥근 몸', '종이 가운데에 위는 둥글고 아래는 물결인 몸을 그려요.', body);

  const armL = b.open('armL', [[70, 250], [42, 260], [36, 284], [68, 290]], ['body', 'body']);
  const armR = b.open('armR', [[330, 250], [358, 260], [364, 284], [332, 290]], ['body', 'body']);
  b.step('작은 팔', '몸 양옆에 동그랗고 짧은 팔을 하나씩 그려요.', armL, armR);

  const eyeL = b.closed('eyeL', ellipse(164, 200, 14, 20));
  const eyeR = b.closed('eyeR', ellipse(236, 200, 14, 20));
  b.step('큰 눈', '몸 위쪽 가운데에 길쭉한 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', ellipse(200, 252, 12, 14));
  b.step('동그란 입', '두 눈 사이 아래에 동그란 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(128, 244, 16, 10));
  const cheekR = b.closed('cheekR', ellipse(272, 244, 16, 10));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const st1 = b.closed('st1', star(334, 70, 20, 8));
  const st2 = b.closed('st2', star(60, 120, 14, 6));
  b.step('반짝 별', '몸 바깥 위쪽 빈 곳에 별을 두 개 그려요.', st1, st2);

  return {
    id: 'ghost', title: '꼬마 유령', theme: 'fantasy', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['상상', '유령', '밤'],
  };
}
