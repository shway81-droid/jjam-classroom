import { bench, ellipse } from './lib.mjs';

// ================================================================ 무당벌레 — 참조 없음(직접 디자인), 위에서 본 모습
// 큰 타원 몸을 먼저 긋고, 머리·가운데 줄·더듬이는 몸에 붙입니다. 더듬이는 끝 동그라미를 먼저 그리고 잇습니다.
export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(200, 296, 128, 146, 12));
  b.step('둥근 몸', '종이 가운데에 위아래로 조금 긴 둥근 몸을 그려요.', body);

  const head = b.open('head', [[136, 184], [140, 140], [168, 112], [200, 104], [232, 112], [260, 140], [264, 184]], ['body', 'body']);
  b.step('머리', '몸 위쪽에 반달처럼 둥근 머리를 붙여 그려요.', head);

  const line = b.open('line', [[200, 152], [200, 300], [200, 440]], ['body', 'body']);
  b.step('가운데 줄', '머리 아래에서 몸 끝까지 가운데에 줄을 그어요.', line);

  const tipL = b.closed('tipL', ellipse(140, 52, 11, 11));
  const tipR = b.closed('tipR', ellipse(260, 52, 11, 11));
  const antL = b.open('antL', [[176, 112], [160, 84], [146, 62]], ['head', 'tipL']);
  const antR = b.open('antR', [[224, 112], [240, 84], [254, 62]], ['head', 'tipR']);
  b.step('더듬이', '머리 위로 끝이 동그란 더듬이를 두 개 그려요.', tipL, tipR, antL, antR);

  const spots = [[138, 220], [118, 300], [148, 378], [262, 220], [282, 300], [252, 378]]
    .map(([x, y], i) => b.closed(`s${i}`, ellipse(x, y, 22, 22)));
  b.step('점 무늬', '몸 양쪽에 동그란 점을 세 개씩 그려요.', ...spots);

  const eyeL = b.closed('eyeL', ellipse(176, 140, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(224, 140, 8, 10));
  b.step('눈 두 개', '머리 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  return {
    id: 'ladybug', title: '무당벌레', theme: 'animal', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '곤충', '봄'],
  };
}
