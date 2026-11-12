/* —— [순수] 카드 뽑기 ——
   고른 주제의 카드를 한 번씩 다 보여 준 뒤에야 다시 섞는다.
   유치원 놀이는 카드가 수십 장뿐이라, 그냥 무작위로 뽑으면 같은 그림이 금방 또 나와
   아이들이 "아까 했어요!" 하고 흐름이 끊긴다.
   새로 섞을 때 첫 장이 바로 앞 장과 같으면 한 칸 뒤로 미룬다 — 같은 그림 연속 금지.
   DOM 을 모른다. scripts/deck.test.mjs 가 규칙을 고정한다. */

/** 피셔-예이츠 섞기. 원본은 건드리지 않는다. */
export function shuffle(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 빈 덱 — 첫 뽑기 때 섞인다. */
export const emptyDeck = () => ({ queue: [], last: null });

/**
 * 다음 카드 하나.
 * @param deck  { queue: 남은 id 목록, last: 바로 앞 id }
 * @param ids   지금 고른 주제에 드는 카드 id 전부 (주제를 바꾸면 달라진다)
 * @returns { id, deck: 새 덱, reshuffled: 이번에 새로 섞었는지 } — ids 가 비면 null
 */
export function drawCard(deck, ids, rng = Math.random) {
  if (!ids.length) return null;
  const allowed = new Set(ids);
  // 주제를 바꿨으면 남은 줄에서 빠진 주제의 카드를 걷어 낸다
  let queue = deck.queue.filter((id) => allowed.has(id));
  let reshuffled = false;
  if (!queue.length) {
    queue = shuffle(ids, rng);
    if (queue.length > 1 && queue[0] === deck.last) [queue[0], queue[1]] = [queue[1], queue[0]];
    reshuffled = true;
  }
  const [id, ...rest] = queue;
  return { id, deck: { queue: rest, last: id }, reshuffled };
}
