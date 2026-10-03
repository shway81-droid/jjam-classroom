import { bench, ellipse } from './lib.mjs';

// ================================================================ 나비 — 참조 없음(직접 디자인), 날개를 활짝 편 모습
// 가운데 몸을 첫 획으로, 날개는 양 끝이 몸에 붙는 열린 획을 좌우 대칭으로 긋습니다.
const mirror = (pts) => pts.map(([x, y]) => [500 - x, y]);

export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(250, 220, 18, 110, 10));
  b.step('가운데 몸', '종이 가운데에 위아래로 길쭉한 몸을 그려요.', body);

  const upL = [[234, 160], [200, 110], [150, 72], [96, 66], [70, 100], [80, 160], [120, 204], [180, 214], [234, 204]];
  const wingUL = b.open('wingUL', upL, ['body', 'body']);
  const wingUR = b.open('wingUR', mirror(upL), ['body', 'body']);
  b.step('위 날개', '몸 위쪽 양옆에 크고 둥근 날개를 하나씩 그려요.', wingUL, wingUR);

  const lowL = [[234, 232], [190, 242], [140, 266], [110, 310], [126, 350], [170, 354], [210, 320], [236, 282]];
  const wingLL = b.open('wingLL', lowL, ['body', 'body']);
  const wingLR = b.open('wingLR', mirror(lowL), ['body', 'body']);
  b.step('아래 날개', '위 날개 아래에 조금 작은 날개를 하나씩 그려요.', wingLL, wingLR);

  const tipL = b.closed('tipL', ellipse(206, 58, 10, 10));
  const tipR = b.closed('tipR', ellipse(294, 58, 10, 10));
  const antL = b.open('antL', [[242, 116], [230, 90], [214, 66]], ['body', 'tipL']);
  const antR = b.open('antR', [[258, 116], [270, 90], [286, 66]], ['body', 'tipR']);
  b.step('더듬이', '몸 위로 끝이 동그란 더듬이를 두 개 그려요.', tipL, tipR, antL, antR);

  const spots = [[128, 128, 24], [160, 306, 17], [372, 128, 24], [340, 306, 17]]
    .map(([x, y, r], i) => b.closed(`s${i}`, ellipse(x, y, r, r)));
  b.step('날개 무늬', '날개마다 동그란 무늬를 하나씩 그려요.', ...spots);

  const lineL = b.open('lineL', [[234, 190], [190, 170], [150, 160]], ['body', 'wingUL']);
  const lineR = b.open('lineR', [[266, 190], [310, 170], [350, 160]], ['body', 'wingUR']);
  b.step('날개 줄', '위 날개 안쪽에 몸에서 뻗은 줄을 하나씩 그어요.', lineL, lineR);

  return {
    id: 'butterfly', title: '나비', theme: 'animal', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손가락만큼 긴 몸부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '곤충', '봄'],
  };
}
