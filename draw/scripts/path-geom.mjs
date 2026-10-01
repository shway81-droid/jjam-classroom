// 획(path d)을 점 열로 펴는 도구. 떠 있는 획 측정과 시안 생성기가 같이 씁니다.
// 데이터가 M · L · C 절대 좌표만 쓰므로(PRD 7.1) 그 셋만 읽습니다.

export function segmentsOf(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) || [];
  const segs = [];
  let cmd = null;
  let nums = [];
  let cur = null;
  let start = null;
  const flush = () => {
    if (cmd === 'M') {
      cur = [nums[0], nums[1]]; start = cur;
      for (let i = 2; i < nums.length; i += 2) { segs.push(['L', cur, [nums[i], nums[i + 1]]]); cur = [nums[i], nums[i + 1]]; }
    } else if (cmd === 'L') {
      for (let i = 0; i < nums.length; i += 2) { segs.push(['L', cur, [nums[i], nums[i + 1]]]); cur = [nums[i], nums[i + 1]]; }
    } else if (cmd === 'C') {
      for (let i = 0; i < nums.length; i += 6) {
        const p = [cur, [nums[i], nums[i + 1]], [nums[i + 2], nums[i + 3]], [nums[i + 4], nums[i + 5]]];
        segs.push(['C', ...p]); cur = p[3];
      }
    } else if (cmd === 'Z' && start) {
      segs.push(['L', cur, start]); cur = start;
    }
    nums = [];
  };
  for (const t of tokens) {
    if (/[MLCZ]/.test(t)) { flush(); cmd = t; } else nums.push(Number(t));
  }
  flush();
  return segs;
}

const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

// 곡선 위의 점들. 한 구간을 n 등분합니다.
export function sample(d, n = 24) {
  const pts = [];
  for (const s of segmentsOf(d)) {
    if (!pts.length) pts.push(s[1]);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      pts.push(s[0] === 'L'
        ? [s[1][0] + (s[2][0] - s[1][0]) * t, s[1][1] + (s[2][1] - s[1][1]) * t]
        : bez(s[1], s[2], s[3], s[4], t));
    }
  }
  return pts;
}

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// 점에서 점 열(꺾은선)까지의 최단 거리와 그 위의 가장 가까운 점
export function nearest(pts, p) {
  let best = { d: Infinity, q: null };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
    const q = [a[0] + dx * t, a[1] + dy * t];
    const dd = dist(p, q);
    if (dd < best.d) best = { d: dd, q };
  }
  return best;
}

export function endsOf(d) {
  const segs = segmentsOf(d);
  const first = segs[0][1];
  const last = segs[segs.length - 1][segs[segs.length - 1][0] === 'L' ? 2 : 4];
  return [first, last];
}

// 떠 있는 획 판정 — PRD 4.1의 4번과 시안 지시의 "양 끝은 이전 획 위".
// 닫힌 획(시작점 = 끝점: 눈·창·별)은 끝이 없으므로 따로 셉니다.
// 맨 첫 획을 뺀 열린 획은 양 끝이 모두 앞서 그린 획(앞 단계 + 같은 단계에서 먼저 적힌 획) 위에 있어야 합니다.
export function floatingReport(drawing, tol = 4) {
  const drawn = [];
  let open = 0;
  let closed = 0;
  const floating = [];
  drawing.steps.forEach((step, i) => {
    step.d.forEach((d, j) => {
      const [a, b] = endsOf(d);
      const isClosed = dist(a, b) < 0.5;
      if (isClosed) closed += 1;
      else if (!drawn.length) open += 1; // 맨 첫 획은 붙을 곳이 없으므로 셈에서 뺍니다
      else {
        open += 1;
        const off = [a, b].map((p) => Math.min(Infinity, ...drawn.map((pts) => nearest(pts, p).d)));
        const loose = off.filter((x) => x > tol).length;
        if (loose) floating.push({ step: i + 1, stroke: j + 1, label: step.label, off: off.map((x) => Math.round(x * 10) / 10) });
      }
      drawn.push(sample(d));
    });
  });
  const total = open + closed;
  return { total, open, closed, floating, ratio: total ? floating.length / total : 0 };
}
