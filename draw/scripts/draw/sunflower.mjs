import { bench, ellipse, smooth } from './lib.mjs';
import { sample } from '../path-geom.mjs';

// 꽃잎 하나하나를 오목한 곳에서 오목한 곳까지 부드럽게 이은 뒤 촘촘한 점으로 바꿉니다(flower.mjs 와 같은 방법).
const ring = (arcs) => arcs.flatMap((a) => sample(smooth(a, false, 1), 3).slice(0, -1))
  .filter((p, i, all) => i === 0 || Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1]) > 1.5);

// ================================================================ 해바라기 — 참조 없음(직접 디자인)
// 앞 꽃잎 열두 장의 바깥 테두리를 한 획으로 먼저 긋습니다. 꽃잎 사이 오목한 곳은 가운데 동그라미 위에
// 놓여, 가운데 동그라미를 그리면 꽃잎이 저절로 나뉩니다. 씨앗은 작은 닫힌 동그라미 두 바퀴입니다.
// (뒤 꽃잎을 앞 꽃잎 사이로 넣어 보았으나 굵은 선에서 뭉쳐 뺐습니다.)
const C = [200, 178];
const N = 12;
const RV = 68; // 꽃잎 사이 오목한 곳 = 가운데 동그라미 반지름
const RT = 140; // 꽃잎 끝
const deg = Math.PI / 180;
const pol = (a, r) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r];
const va = (i) => -Math.PI / 2 + ((i + 0.5) / N) * Math.PI * 2; // 오목한 곳의 각도

export default function draw() {
  const b = bench();
  const arcs = Array.from({ length: N }, (_, i) => {
    const a0 = va(i - 1); const a1 = va(i); const m = (a0 + a1) / 2;
    return [pol(a0, RV), pol(a0 + 3 * deg, RV + 28), pol(m - 6 * deg, RT - 12), pol(m, RT),
      pol(m + 6 * deg, RT - 12), pol(a1 - 3 * deg, RV + 28), pol(a1, RV)];
  });
  const petals = b.closed('petals', ring(arcs), 0.5);
  b.step('꽃잎 테두리', '종이 위쪽에 길쭉한 꽃잎이 빙 둘러 난 큰 꽃을 그려요.', petals);

  const center = b.closed('center', ellipse(C[0], C[1], RV, RV, 16));
  b.step('꽃 가운데', '꽃 한가운데에 꽃잎에 닿는 큰 동그라미를 그려요.', center);

  // 씨앗 — 안쪽에 여섯 개, 그 사이사이 바깥쪽에 여섯 개
  const dots = (r, off, tag) => Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + off + (i / 6) * Math.PI * 2;
    return b.closed(`${tag}${i}`, ellipse(C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r, 5, 5));
  });
  b.step('안쪽 씨앗', '가운데 동그라미 안쪽에 작은 씨앗을 빙 둘러 그려요.', ...dots(24, 0, 'seedIn'));
  b.step('바깥쪽 씨앗', '씨앗 사이사이 바깥쪽에 씨앗을 한 바퀴 더 그려요.', ...dots(48, Math.PI / 6, 'seedOut'));

  // 굵은 줄기 — 꽃 아래에서 내려갔다가 바닥에서 돌아 다시 꽃까지 올라옵니다.
  const stem = b.open('stem', [
    [190, 300], [190, 360], [189, 420], [190, 462], [200, 466], [210, 462],
    [211, 420], [210, 360], [210, 300],
  ], ['petals', 'petals']);
  b.step('줄기', '꽃 아래에서 길게 내려오는 굵은 줄기를 그려요.', stem);

  const leafL = b.open('leafL', [
    [190, 392], [168, 396], [138, 390], [110, 374], [86, 350], [116, 340],
    [148, 342], [174, 356], [190, 372],
  ], ['stem', 'stem'], 0.8);
  const veinL = b.open('veinL', [[190, 382], [150, 366], [90, 350]], ['stem', 'leafL']);
  b.step('왼쪽 잎', '줄기 왼쪽에 끝이 뾰족한 넓은 잎을 그려요.', leafL);
  b.step('왼쪽 잎맥', '왼쪽 잎 가운데에 잎 끝까지 줄을 그어요.', veinL);
  const leafR = b.open('leafR', [
    [210, 420], [222, 398], [244, 380], [272, 368], [314, 364], [300, 390],
    [278, 412], [246, 426], [210, 432],
  ], ['stem', 'stem'], 0.8);
  b.step('오른쪽 잎', '줄기 오른쪽 조금 아래에 잎을 하나 더 그려요.', leafR);

  const veinR = b.open('veinR', [[210, 424], [256, 398], [310, 366]], ['stem', 'leafR']);
  b.step('오른쪽 잎맥', '오른쪽 잎 가운데에도 잎 끝까지 줄을 그어요.', veinR);

  return {
    id: 'sunflower', title: '해바라기', theme: 'plant', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥만큼 크게 꽃을 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['식물', '꽃', '여름'],
  };
}
