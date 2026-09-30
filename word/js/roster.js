/* 인물퀴즈 명단 — 번호·세트·정답지 순서 출제 (2026-09-30 선생님 요청)

   문제가 무작위로 나오면 정답 리스트가 있어도 선생님이 그 얼굴을 찾아야 판정할 수 있다.
   그래서 인물마다 고정 번호(No.)를 붙이고, 원하면 정답지 순서대로 10명씩 끊어 낸다.
   출제 화면(app.js)과 정답 리스트(people.js)가 같은 번호를 쓰도록 여기 한 곳에서 정한다.

   화면을 모르는 순수 함수만 둔다(pick.js 와 같은 원칙). */

// 한 세트의 인물 수 — 자투리 5분에 10명 안팎을 푼다(PRD 1.3).
export const SET_SIZE = 10;

// 출제 창 → 선생님 창(정답 리스트) 방송 채널. 같은 브라우저의 두 창끼리만 통한다.
export const LIVE_CHANNEL = 'jjam-word:person-live';

/** 인물 id → 번호(1부터). words.json 에 적힌 순서 그대로 — 분야별로 모여 있다. */
export function numberPeople(items) {
  const numbers = new Map();
  let n = 0;
  for (const it of items) {
    if (it.type === 'person') numbers.set(it.id, ++n);
  }
  return numbers;
}

/** 고른 조건의 후보(데이터 순서)를 SET_SIZE 명씩 끊는다. 번호는 첫 사람·끝 사람의 번호. */
export function setsOf(pool, numbers) {
  const sets = [];
  for (let at = 0; at < pool.length; at += SET_SIZE) {
    const chunk = pool.slice(at, at + SET_SIZE);
    sets.push({
      start: at,
      size: chunk.length,
      from: numbers.get(chunk[0].id),
      to: numbers.get(chunk[chunk.length - 1].id),
    });
  }
  return sets;
}

/** 정답지 순서 출제 — 지금 자리(pos)의 다음. 끝까지 가면 처음으로 돈다(화면이 멈추지 않게). */
export function nextInOrder(pool, pos) {
  if (!pool || pool.length === 0) return null;
  const next = pos + 1 >= pool.length ? 0 : pos + 1;
  return { item: pool[next], pos: next, wrapped: next === 0 && pos >= 0 };
}
