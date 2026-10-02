import { bench, ellipse } from './lib.mjs';

// ================================================================ 개구리 — 참조 없음(직접 디자인), 앞을 보고 앉아 있습니다
// 납작하고 넓은 몸을 첫 획으로, 눈 언덕·다리는 양 끝이 몸에 붙는 열린 획입니다.
const mirror = (pts) => pts.map(([x, y]) => [500 - x, y]);

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [250, 130], [320, 140], [370, 180], [390, 240], [380, 300], [340, 340],
    [250, 352], [160, 340], [120, 300], [110, 240], [130, 180], [180, 140],
  ]);
  b.step('넓은 몸', '종이 가운데에 옆으로 넓적한 몸을 그려요.', body);

  const bumpL = [[160, 160], [152, 120], [170, 84], [200, 76], [226, 94], [234, 136]];
  const eyeBL = b.open('eyeBL', bumpL, ['body', 'body']);
  const eyeBR = b.open('eyeBR', mirror(bumpL), ['body', 'body']);
  b.step('눈 언덕', '몸 위쪽 양옆에 볼록 솟은 눈 언덕을 그려요.', eyeBL, eyeBR);

  const eyeL = b.closed('eyeL', ellipse(194, 116, 20, 20));
  const eyeR = b.closed('eyeR', ellipse(306, 116, 20, 20));
  b.step('큰 눈', '눈 언덕 안에 크고 동그란 눈을 그려요.', eyeL, eyeR);

  const pupilL = b.closed('pupilL', ellipse(198, 120, 8, 8));
  const pupilR = b.closed('pupilR', ellipse(302, 120, 8, 8));
  b.step('눈동자', '큰 눈 안에 작은 눈동자를 하나씩 그려요.', pupilL, pupilR);

  const noseL = b.closed('noseL', ellipse(236, 188, 4, 4));
  const noseR = b.closed('noseR', ellipse(264, 188, 4, 4));
  b.step('콧구멍', '두 눈 사이 아래에 작은 콧구멍을 두 개 그려요.', noseL, noseR);

  const mouth = b.closed('mouth', [[192, 212], [250, 224], [308, 212], [300, 228], [250, 242], [200, 228]], 0.8);
  b.step('웃는 입', '콧구멍 아래에 옆으로 길게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(164, 236, 16, 10));
  const cheekR = b.closed('cheekR', ellipse(336, 236, 16, 10));
  b.step('볼 두 개', '입 양 끝 옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const belly = b.closed('belly', ellipse(250, 304, 60, 30, 10));
  b.step('배', '입 아래 몸 가운데에 둥근 배를 그려요.', belly);

  const legL = [[116, 282], [86, 300], [78, 340], [100, 368], [140, 370], [168, 344]];
  const backL = b.open('backL', legL, ['body', 'body']);
  const backR = b.open('backR', mirror(legL), ['body', 'body']);
  b.step('뒷다리', '몸 아래 양옆에 접힌 뒷다리를 그려요.', backL, backR);

  const footL = [[180, 342], [170, 366], [150, 380], [158, 394], [176, 386], [186, 396], [198, 388], [204, 372], [206, 348]];
  const frontL = b.open('frontL', footL, ['body', 'body'], 0.8);
  const frontR = b.open('frontR', mirror(footL), ['body', 'body'], 0.8);
  b.step('앞발', '배 양옆 아래에 발가락이 있는 앞발을 그려요.', frontL, frontR);

  return {
    id: 'frog', title: '개구리', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 넓은 몸부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '개구리', '연못'],
  };
}
