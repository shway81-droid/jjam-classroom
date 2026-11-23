# 짬짬이 교실 1분 소개 영상

여덟 사이트를 한 번에 보여 주는 소개 영상의 원본입니다. [Remotion](https://www.remotion.dev)으로 만듭니다.
딸깍 보결의 [1분 소개 영상](https://github.com/shway81-droid/ttalkkak-bogyul/tree/main/video)과 같은 방식입니다.

완성본: [`jjam-classroom-intro.mp4`](jjam-classroom-intro.mp4) (약 12.4MB)

**어떻게 만들어졌는지 자세히: [`docs/소개영상_만드는_법.md`](docs/소개영상_만드는_법.md)**

- 1920×1080 · 30fps · 약 55초 · 배경음악 + 효과음(내레이션 없음), 음량 약 −16.5 LUFS(유튜브 권장)
- 배경음악은 `scripts/make-bgm.mjs` 가 **코드로 직접 만든 곡**입니다(밝은 D장조 100 BPM, 패드·마림바·종소리·베이스·가벼운 드럼). 남의 곡을 쓰지 않아 유튜브 저작권(Content ID) 걱정이 없습니다.
- 장면: 고민 → 제목 → 여덟 가지(모아보기) → 사이트 여덟 칸 → 바로가기 → 약속 네 가지 → 마무리
- 효과음 셋: 칸이 바뀔 때 `whoosh`, 바로가기 띠에 `mouse-click`, 마무리에 `ding`

## ⛔ 이 폴더는 사이트가 아닙니다

`intro/` 는 저장소에서 **유일하게 사이트가 아닌 내용 폴더**입니다. 발행 워크플로
(`publish-dispatch.yml`·`home.yml`)의 `paths` 에 들어 있지 않으므로, 여기를 고쳐도
**어떤 사이트도 다시 발행되지 않습니다.** 그러라고 따로 둔 자리입니다.

반대로 `home/` 안에 두면 커밋 하나하나가 곧 모아보기 배포가 됩니다. 옮기지 마세요.

## 두 가지를 손으로 적지 않습니다

9/30 사고와 모아보기 개수 이야기(저장소 맨 위 `CLAUDE.md`, `scripts/sync-counts.mjs`)에서
온 원칙입니다. **영상은 한 번 올리면 고치기 어렵고 유튜브·메신저에 그대로 남습니다.**

1. **화면** — 그림으로 그리지 않고 `scripts/capture.mjs` 가 저장소를 띄워 **진짜 사이트를
   찍습니다.** 사이트가 바뀌면 다시 찍기만 하면 영상도 따라옵니다. 아이콘·로고도 모아보기의
   SVG 에서 가져옵니다.
2. **글귀와 개수** — `scripts/sites.mjs` 가 모아보기(`home/index.html`)에서 이름·한 줄 소개·
   걸리는 시간을 읽고, 개수는 `scripts/sync-counts.mjs` 로 **데이터에서 다시 뽑습니다.**
   저장소의 `home/index.html` 에 적힌 수는 낡아 있을 수 있어서(발행 직전에 `home.yml` 이
   고쳐 올립니다) 그대로 찍으면 **사이트에는 없는 옛 숫자**가 영상에 박힙니다.
   2026-11-23 실제로 그랬습니다 — 문항 1,944 · 차시 영상 192 · 그림 44.
   그래서 찍기 전에 그 값을 덮어씁니다. 원본 `home/index.html` 은 건드리지 않습니다.

누를 곳을 못 찾거나 사이트가 여덟이 아니면 **조용히 넘어가지 않고 멈춥니다.**
빈 화면이 영상에 박히는 것보다 낫기 때문입니다.

## 만들기

```bash
cd intro && npm install
```

```bash
cd intro && npm run prep
```

```bash
cd intro && npm run render
```

- `prep` 은 글꼴 복사 · 로고 복사 · 효과음 받기 · 사이트 글귀와 개수 뽑기 · 사이트 화면 찍기 ·
  배경음악 만들기를 차례로 합니다. 결과는 모두 `public/` 아래이고 저장소에는 넣지 않습니다.
- 미리 보며 고치기: `npm run dev` (Remotion Studio)
- 사이트가 바뀌면 `npm run prep` 을 다시 돌린 뒤 렌더합니다.
- Playwright 브라우저가 다른 곳에 있으면 `CHROME_PATH=/경로/chrome npm run prep`.
- 검사: `npm run lint` (eslint + tsc). **`prep` 을 먼저 돌려야 합니다** — `public/sites.json`
  과 `public/shots/shots.json` 을 읽어서 타입을 맞추기 때문입니다. 그래서 이 폴더는 CI 를
  걸지 않았습니다(크로미움과 캡처가 있어야 검사가 됩니다). 딸깍 보결 쪽도 같습니다.

## 파일

| 파일 | 하는 일 |
| --- | --- |
| `src/IntroVideo.tsx` | 장면 순서·길이·전환, 배경음악 |
| `src/scenes/*.tsx` | 장면 하나에 파일 하나 |
| `src/sites.ts` | 여덟 사이트 — 글귀는 `public/sites.json` 에서, 색과 쓸 화면만 여기서 |
| `src/theme.tsx` | 모아보기와 같은 색·글꼴, 공통 조각(화면 틀·아이콘) |
| `scripts/serve.mjs` | 저장소를 그대로 띄우는 작은 정적 서버 |
| `scripts/sites.mjs` | 모아보기에서 이름·한 줄·시간·개수 읽기 → `public/sites.json` |
| `scripts/capture.mjs` | 진짜 사이트 화면·아이콘 찍기 → `public/shots/` |
| `scripts/make-bgm.mjs` | 배경음악 만들기 → `public/bgm.wav` |
| `scripts/prep.mjs` | 위를 순서대로 |
| `docs/소개영상_만드는_법.md` | 만들어지는 과정 전체와 고칠 곳 안내 |

## 장면

| # | 장면 | 길이 | 내용 |
| --- | --- | --- | --- |
| 1 | Hook | 3.5초 | "수업이 일찍 끝났어요 / 남은 10분, 뭘 하지?" |
| 2 | Title | 4.7초 | 짬짬이 교실 · 짬짬이.com |
| 3 | Eight | 6.2초 | 모아보기 한 화면 + 아이콘 여덟이 차례로 |
| 4 | Sites | 26.7초 | 사이트 여덟 칸(3.3초씩). 네 곳은 중간에 활동 화면이 밀고 올라온다 |
| 5 | Switcher | 5.5초 | 머리 위 바로가기 줄 · 전체 보기 |
| 6 | Free | 5.3초 | 모두 무료 · 설치 없음 · 로그인 없음 · 큰 화면 |
| 7 | Outro | 5.7초 | 짬짬이 교실 · 짬짬이.com |

## 영상을 올린 뒤

- 올린 영상: (아직 올리지 않음)

## 저작권

- 글꼴: Pretendard, SIL Open Font License 1.1
- 효과음: Remotion 제공(remotion.media)
- 배경음악: 이 저장소에서 직접 만든 곡(`scripts/make-bgm.mjs`)
- 화면·아이콘·그림: 짬짬이 교실의 여덟 사이트
