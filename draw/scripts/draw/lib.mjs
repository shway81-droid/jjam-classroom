// 그림 작업대 — 지나가는 점만 적으면 부드러운 3차 베지어(C)로 이어 주고(Catmull-Rom → Bezier),
// 열린 획의 양 끝은 앞서 그린 획 위의 가장 가까운 점에 붙입니다(snap).
// 끝점을 손으로 맞추면 반드시 어긋나므로 계산으로 붙입니다(PRD 4.1의 4번 — 떠 있는 획 0개).
import { sample, nearest, dist } from '../path-geom.mjs';

const r1 = (x) => Math.round(x * 10) / 10;
const fmt = (p) => `${r1(p[0])} ${r1(p[1])}`;

// 지나가는 점 → C 구간. tension 1 이 표준 Catmull-Rom 입니다.
export function smooth(pts, closed = false, tension = 1) {
  const P = closed ? [...pts, pts[0]] : pts;
  const get = (i) => {
    if (closed) return pts[((i % pts.length) + pts.length) % pts.length];
    return P[Math.max(0, Math.min(P.length - 1, i))];
  };
  let d = `M ${fmt(P[0])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = get(i + 2);
    const k = tension / 6;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C ${fmt(c1)}, ${fmt(c2)}, ${fmt(p2)}`;
  }
  return d;
}

// 그림 하나를 짓는 작업대. 획마다 이름을 붙여 두고 뒤 획이 그 위에 끝점을 붙입니다.
export function bench() {
  const named = {};
  const all = [];
  const steps = [];
  const snap = (name, p) => nearest(named[name], p).q;
  const add = (name, d) => { const pts = sample(d, 40); named[name] = pts; all.push(pts); return d; };
  // 가까운 앞 획 아무 데나 붙이기
  const snapAny = (p) => all.reduce((b, pts) => { const n = nearest(pts, p); return n.d < b.d ? n : b; }, { d: Infinity }).q;
  return {
    snap,
    snapAny,
    closed: (name, pts, t) => add(name, smooth(pts, true, t)),
    // ends: [시작 붙일 획 이름, 끝 붙일 획 이름]
    open: (name, pts, [a, b], t) => {
      const P = pts.slice();
      P[0] = a ? snap(a, P[0]) : P[0];
      P[P.length - 1] = b ? snap(b, P[P.length - 1]) : P[P.length - 1];
      return add(name, smooth(P, false, t));
    },
    // 앞 획 테두리를 따라가며 바깥으로 혹을 n개 내는 획(등 뿔). 양 끝과 혹 사이가 테두리 위에 놓입니다.
    // wrap: 닫힌 테두리에서 끝을 넘어 처음으로 이어 가는 쪽으로 지나갑니다.
    bumps: (name, on, from, to, n, h, flip = 1, wrap = false) => {
      const base = named[on];
      const idx = (p) => {
        let bi = 0; let bd = Infinity;
        base.forEach((q, i) => { const dd = dist(q, p); if (dd < bd) { bd = dd; bi = i; } });
        return bi;
      };
      const i0 = idx(from); const i1 = idx(to);
      const seg = wrap ? [...base.slice(i0), ...base.slice(1, i1 + 1)]
        : i0 <= i1 ? base.slice(i0, i1 + 1) : base.slice(i1, i0 + 1).reverse();
      // 누적 길이로 n 등분
      const acc = [0];
      for (let i = 1; i < seg.length; i++) acc.push(acc[i - 1] + dist(seg[i - 1], seg[i]));
      const L = acc[acc.length - 1];
      const at = (s) => {
        let i = acc.findIndex((a) => a >= s); if (i <= 0) i = 1;
        const t = (s - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
        const p = [seg[i - 1][0] + (seg[i][0] - seg[i - 1][0]) * t, seg[i - 1][1] + (seg[i][1] - seg[i - 1][1]) * t];
        const tx = seg[i][0] - seg[i - 1][0]; const ty = seg[i][1] - seg[i - 1][1]; const tl = Math.hypot(tx, ty) || 1;
        return { p, nx: (ty / tl) * flip, ny: (-tx / tl) * flip };
      };
      let d = '';
      for (let k = 0; k < n; k++) {
        const a = at((L * k) / n).p;
        const b = at((L * (k + 1)) / n).p;
        // 혹의 방향은 양 끝을 잇는 선의 수직 — 굽은 테두리에서도 혹이 한쪽으로 기울지 않습니다.
        const cx = b[0] - a[0]; const cy = b[1] - a[1]; const cl = Math.hypot(cx, cy) || 1;
        const nx = (cy / cl) * flip; const ny = (-cx / cl) * flip;
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const top = [mid[0] + nx * h, mid[1] + ny * h];
        const s1 = [a[0] + nx * h * 0.75, a[1] + ny * h * 0.75];
        const s2 = [top[0] - cx * 0.3, top[1] - cy * 0.3];
        const s3 = [top[0] + cx * 0.3, top[1] + cy * 0.3];
        const s4 = [b[0] + nx * h * 0.75, b[1] + ny * h * 0.75];
        if (!d) d = `M ${fmt(a)}`;
        d += ` C ${fmt(s1)}, ${fmt(s2)}, ${fmt(top)} C ${fmt(s3)}, ${fmt(s4)}, ${fmt(b)}`;
      }
      return add(name, d);
    },
    step: (label, teacherSay, ...d) => steps.push({ d, label, teacherSay }),
    steps,
  };
}

export const ellipse = (cx, cy, rx, ry, n = 8, rot = 0) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(a) * rx; const y = Math.sin(a) * ry;
  const c = Math.cos(rot); const s = Math.sin(rot);
  return [cx + x * c - y * s, cy + x * s + y * c];
});
export const star = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  const rr = i % 2 ? r : R;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
});
