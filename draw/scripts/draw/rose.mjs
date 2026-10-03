import { bench, ellipse } from './lib.mjs';

// ================================================================ 장미 — 참조 없음(직접 디자인)
// 꽃송이 테두리를 먼저 긋고, 가운데 점에서 바깥으로 돌돌 말린 꽃잎을 한 획으로 잇습니다.
export default function draw() {
  const b = bench();
  const bloom = b.closed('bloom', [[110, 170], [140, 110], [200, 90], [260, 110], [290, 170], [280, 226], [244, 262], [200, 272], [156, 262], [120, 226]], 0.9);
  b.step('꽃송이', '종이 위쪽 가운데에 크고 둥근 꽃송이를 그려요.', bloom);

  const core = b.closed('core', ellipse(200, 178, 7, 7));
  b.step('가운데', '꽃송이 가운데에 작은 동그라미를 그려요.', core);

  const turns = 2.2; const n = 26;
  const sp = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n; const r = 7 + 66 * t; const a = t * turns * Math.PI * 2 - Math.PI / 2;
    return [200 + Math.cos(a) * r * 1.05, 178 + Math.sin(a) * r * 0.9];
  });
  const last = sp[sp.length - 1];
  sp.push([200 + (last[0] - 200) * 1.25, 178 + (last[1] - 178) * 1.25]);
  const swirl = b.open('swirl', sp, ['core', 'bloom']);
  b.step('돌돌 꽃잎', '가운데에서 바깥으로 돌돌 말린 꽃잎을 그려요.', swirl);

  const stem = b.closed('stem', [[194, 270], [192, 360], [196, 462], [206, 462], [204, 360], [206, 270]], 0.4);
  b.step('줄기', '꽃송이 아래에 길쭉한 줄기를 그려요.', stem);

  const leafL = b.closed('leafL', [[194, 376], [168, 352], [128, 344], [112, 362], [140, 384], [180, 388]], 0.8);
  b.step('왼쪽 잎', '줄기 왼쪽에 끝이 뾰족한 잎을 그려요.', leafL);

  const leafR = b.closed('leafR', [[206, 330], [232, 304], [272, 296], [288, 314], [260, 336], [220, 342]], 0.8);
  b.step('오른쪽 잎', '줄기 오른쪽 위에도 잎을 하나 그려요.', leafR);

  const vL = b.open('vL', [[190, 378], [156, 364], [118, 356]], ['leafL', 'leafL']);
  const vR = b.open('vR', [[210, 332], [244, 316], [282, 306]], ['leafR', 'leafR']);
  b.step('잎맥', '잎마다 가운데에 잎맥을 그어요.', vL, vR);

  const th1 = b.closed('th1', [[194, 410], [180, 404], [194, 398]], 0.2);
  const th2 = b.closed('th2', [[206, 430], [220, 424], [206, 418]], 0.2);
  b.step('가시', '줄기 양옆에 작은 가시를 하나씩 그려요.', th1, th2);

  const sep = b.open('sep', [[160, 262], [176, 286], [200, 274], [224, 286], [240, 262]], ['bloom', 'bloom']);
  b.step('꽃받침', '꽃송이 아래에 뾰족한 꽃받침을 그려요.', sep);

  return {
    id: 'rose', title: '장미', theme: 'plant', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹보다 큰 꽃송이부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['식물', '꽃', '봄'],
  };
}
