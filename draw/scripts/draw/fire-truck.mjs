import { bench, ellipse } from './lib.mjs';

// ================================================================ 소방차 — 참조 없음(직접 디자인), 옆모습
// 바퀴 자리가 파인 차 몸을 첫 획으로 긋고, 바퀴·창문·사다리를 차례로 얹습니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];
// 바퀴 자리(반원으로 파인 곳) — 오른쪽에서 왼쪽으로 지나갑니다.
const arch = (cx, r) => Array.from({ length: 7 }, (_, i) => {
  const a = (i / 6) * Math.PI;
  return [cx + Math.cos(a) * r, 300 - Math.sin(a) * r];
});

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [60, 200], [300, 200], [300, 150], [380, 150], [430, 220], [440, 300],
    ...arch(360, 42), [250, 300], ...arch(130, 42), [60, 300],
  ], 0.15);
  b.step('차 몸', '종이 가운데에 앞이 높은 긴 차 몸을 그려요.', body);

  const wL = b.closed('wL', ellipse(130, 304, 34, 34, 12));
  const wR = b.closed('wR', ellipse(360, 304, 34, 34, 12));
  b.step('바퀴', '파인 자리마다 동그란 바퀴를 그려요.', wL, wR);

  const hL = b.closed('hL', ellipse(130, 304, 12, 12, 8));
  const hR = b.closed('hR', ellipse(360, 304, 12, 12, 8));
  b.step('바퀴 가운데', '바퀴 한가운데에 작은 동그라미를 그려요.', hL, hR);

  const win = b.closed('win', [[316, 164], [372, 164], [408, 212], [316, 212]], 0.1);
  b.step('창문', '차 앞쪽 위에 비스듬한 창문을 그려요.', win);

  const siren = b.open('siren', [[324, 150], [326, 136], [340, 128], [354, 136], [356, 150]], ['body', 'body']);
  b.step('경광등', '창문 위 지붕에 둥근 경광등을 그려요.', siren);

  const ladder = b.closed('ladder', rect(80, 172, 290, 190), 0.1);
  b.step('사다리', '차 몸 위에 옆으로 긴 사다리를 그려요.', ladder);

  const rungs = [112, 148, 184, 220, 256].map((x, i) => b.open(`rg${i}`, [[x, 172], [x, 190]], ['ladder', 'ladder']));
  b.step('사다리 칸', '사다리 안에 짧은 세로줄을 다섯 개 그어요.', ...rungs);

  const legL = b.closed('legL', rect(100, 190, 116, 200), 0.1);
  const legR = b.closed('legR', rect(262, 190, 278, 200), 0.1);
  b.step('받침', '사다리 아래에 작은 받침을 두 개 그려요.', legL, legR);

  const stripe = b.open('stripe', [[60, 240], [250, 240], [432, 240]], ['body', 'body']);
  b.step('줄무늬', '차 몸 가운데를 가로지르는 줄을 그어요.', stripe);

  const reel = b.closed('reel', ellipse(210, 272, 20, 20, 10));
  const reelIn = b.closed('reelIn', ellipse(210, 272, 7, 7, 8));
  b.step('호스 감개', '두 바퀴 사이에 둥근 호스 감개를 그려요.', reel, reelIn);

  const knob = b.closed('knob', rect(376, 220, 392, 228), 0.2);
  b.step('손잡이', '창문 아래에 작은 손잡이를 그려요.', knob);

  const light = b.closed('light', ellipse(424, 266, 7, 9));
  b.step('앞등', '차 맨 앞에 동그란 앞등을 그려요.', light);

  const flL = b.closed('flL', [[318, 128], [304, 120], [306, 136]], 0.2);
  const flR = b.closed('flR', [[362, 128], [376, 120], [374, 136]], 0.2);
  b.step('불빛', '경광등 양옆에 반짝이는 불빛을 그려요.', flL, flR);

  return {
    id: 'fire-truck', title: '소방차', theme: 'thing', difficulty: 'hard', grades: ['upper'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 종이를 가로지르는 긴 차 몸부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['탈것', '소방관', '안전'],
  };
}
