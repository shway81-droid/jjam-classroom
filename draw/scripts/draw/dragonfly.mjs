import { bench, ellipse } from './lib.mjs';

// ================================================================ 잠자리 — 참조 없음(직접 디자인), 위에서 본 가을 잠자리
// 길쭉한 몸과 꼬리를 첫 획으로(세로로 길게), 날개는 양 끝이 몸에 붙는 열린 획을 좌우 대칭으로 긋습니다.
const mirror = (pts) => pts.map(([x, y]) => [400 - x, y]);

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [200, 108], [220, 120], [226, 160], [220, 200], [210, 240], [208, 300],
    [206, 380], [204, 440], [200, 456], [196, 440], [194, 380], [192, 300],
    [190, 240], [180, 200], [174, 160], [180, 120],
  ]);
  b.step('긴 몸', '종이 가운데에 위에서 아래로 길쭉한 몸을 그려요.', body);

  const head = b.closed('head', ellipse(200, 80, 34, 28, 10));
  b.step('머리', '몸 위쪽 끝에 옆으로 넓적한 머리를 그려요.', head);

  const eyeL = b.closed('eyeL', ellipse(182, 72, 14, 14));
  const eyeR = b.closed('eyeR', ellipse(218, 72, 14, 14));
  b.step('큰 눈', '머리 양쪽에 크고 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[190, 94], [200, 98], [210, 94], [206, 102], [200, 104], [194, 102]], 0.8);
  b.step('웃는 입', '두 눈 아래 가운데에 작게 웃는 입을 그려요.', mouth);

  const upL = [[178, 140], [120, 110], [60, 104], [36, 126], [52, 150], [110, 160], [176, 162]];
  const wingUL = b.open('wingUL', upL, ['body', 'body']);
  const wingUR = b.open('wingUR', mirror(upL), ['body', 'body']);
  b.step('위 날개', '몸 위쪽 양옆에 길쭉한 날개를 하나씩 그려요.', wingUL, wingUR);

  const lowL = [[180, 182], [120, 190], [66, 206], [52, 232], [76, 246], [130, 232], [182, 208]];
  const wingLL = b.open('wingLL', lowL, ['body', 'body']);
  const wingLR = b.open('wingLR', mirror(lowL), ['body', 'body']);
  b.step('아래 날개', '위 날개 아래에도 길쭉한 날개를 하나씩 그려요.', wingLL, wingLR);

  const vUL = b.open('vUL', [[178, 150], [112, 134], [48, 128]], ['body', 'wingUL']);
  const vUR = b.open('vUR', mirror([[178, 150], [112, 134], [48, 128]]), ['body', 'wingUR']);
  b.step('위 날개 줄', '위 날개 가운데에 몸에서 뻗은 줄을 그어요.', vUL, vUR);

  const vLL = b.open('vLL', [[182, 196], [120, 210], [62, 224]], ['body', 'wingLL']);
  const vLR = b.open('vLR', mirror([[182, 196], [120, 210], [62, 224]]), ['body', 'wingLR']);
  b.step('아래 날개 줄', '아래 날개 가운데에도 몸에서 뻗은 줄을 그어요.', vLL, vLR);

  const segs = [260, 300, 340, 380, 420].map((y, i) => b.open(`sg${i}`, [[188, y], [200, y], [212, y]], ['body', 'body']));
  b.step('꼬리 마디', '긴 꼬리에 가로줄을 다섯 개 그어 마디를 나눠요.', ...segs);

  return {
    id: 'dragonfly', title: '잠자리', theme: 'season', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 위아래로 길쭉한 몸부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['계절', '가을', '곤충'],
  };
}
