import { bench, ellipse } from './lib.mjs';

// ================================================================ 꿀벌 — 참조 없음(직접 디자인)
// 통통한 몸을 먼저 긋고, 날개·침·더듬이는 몸 위에 양 끝을 붙입니다. 얼굴은 왼쪽에 둡니다.
export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(250, 230, 110, 80, 14));
  b.step('통통한 몸', '종이 가운데에 옆으로 통통한 몸을 그려요.', body);

  const st1 = b.open('st1', [[250, 152], [242, 230], [250, 308]], ['body', 'body']);
  const st2 = b.open('st2', [[304, 158], [298, 230], [304, 302]], ['body', 'body']);
  b.step('줄무늬', '몸 오른쪽에 둥근 세로줄을 두 개 그어요.', st1, st2);

  const wL = b.open('wL', [[236, 152], [198, 122], [192, 88], [230, 80], [266, 150]], ['body', 'body']);
  const wR = b.open('wR', [[282, 150], [304, 86], [346, 88], [354, 126], [322, 160]], ['body', 'body']);
  b.step('날개', '몸 위쪽에 둥근 날개를 두 개 그려요.', wL, wR);

  const sting = b.open('sting', [[358, 218], [388, 230], [358, 242]], ['body', 'body'], 0.3);
  b.step('침', '몸 오른쪽 끝에 뾰족한 침을 그려요.', sting);

  const tL = b.closed('tL', ellipse(140, 104, 8, 8));
  const tR = b.closed('tR', ellipse(170, 86, 8, 8));
  const aL = b.open('aL', [[170, 164], [150, 132], [142, 112]], ['body', 'tL']);
  const aR = b.open('aR', [[192, 156], [178, 120], [171, 94]], ['body', 'tR']);
  b.step('더듬이', '몸 왼쪽 위에 끝이 동그란 더듬이를 그려요.', tL, tR, aL, aR);

  const eyeL = b.closed('eyeL', ellipse(176, 212, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(210, 212, 8, 10));
  b.step('눈 두 개', '몸 왼쪽에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[180, 236], [193, 242], [206, 236], [202, 247], [193, 251], [184, 247]], 0.8);
  b.step('웃는 입', '두 눈 아래에 방긋 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(160, 238, 10, 6));
  const cheekR = b.closed('cheekR', ellipse(226, 238, 10, 6));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'bee', title: '꿀벌', theme: 'animal', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 큰 몸부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '곤충', '봄'],
  };
}
