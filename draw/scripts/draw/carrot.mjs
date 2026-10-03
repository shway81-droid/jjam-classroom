import { bench, ellipse } from './lib.mjs';

// ================================================================ 당근 — 참조 없음(직접 디자인)
// 아래로 뾰족한 몸을 먼저 긋고, 잎 셋을 위에 얹은 뒤 가로 골과 얼굴을 넣습니다.
export default function draw() {
  const b = bench();
  const body = b.closed('body', [[150, 170], [200, 160], [250, 170], [238, 260], [216, 360], [200, 440], [184, 360], [162, 260]], 0.6);
  b.step('당근 몸', '종이 가운데에 아래로 뾰족한 긴 몸을 그려요.', body);

  const leafC = b.closed('leafC', [[190, 164], [180, 110], [200, 54], [220, 110], [210, 164]], 0.8);
  b.step('가운데 잎', '몸 위 가운데에 길쭉한 잎을 그려요.', leafC);

  const leafL = b.closed('leafL', [[180, 168], [140, 132], [118, 84], [164, 112], [194, 162]], 0.8);
  const leafR = b.closed('leafR', [[220, 168], [260, 132], [282, 84], [236, 112], [206, 162]], 0.8);
  b.step('양옆 잎', '가운데 잎 양옆에 잎을 하나씩 더 그려요.', leafL, leafR);

  const g1 = b.open('g1', [[170, 290], [200, 298], [230, 290]], ['body', 'body']);
  const g2 = b.open('g2', [[184, 360], [200, 366], [216, 360]], ['body', 'body']);
  b.step('가로 골', '몸 아래쪽에 짧은 가로줄을 두 개 그어요.', g1, g2);

  const eyeL = b.closed('eyeL', ellipse(184, 204, 6, 8));
  const eyeR = b.closed('eyeR', ellipse(216, 204, 6, 8));
  b.step('눈 두 개', '몸 위쪽에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[190, 224], [200, 229], [210, 224], [206, 233], [200, 236], [194, 233]], 0.8);
  b.step('웃는 입', '두 눈 아래에 작게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(173, 226, 9, 6));
  const cheekR = b.closed('cheekR', ellipse(227, 226, 9, 6));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'carrot', title: '당근', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥보다 긴 당근 몸부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['채소', '음식', '텃밭'],
  };
}
