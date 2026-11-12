# 짬짬이 유치원 (jjam-kinder)

글자를 아직 못 읽는 유치원 아이들을 위한 전자칠판 놀이. 짬짬이 낱말의 '몸으로 말해요'를
유치원용으로 다시 만든 것이다 — **카드마다 그림이 있고, 그림만 보고도 무슨 낱말인지 안다.**
`jjam-classroom` 저장소의 `kinder/` 폴더. 정적 SPA, 빌드 단계 없음.

## 대상을 잊지 않는다 — 유치원(만 3~5세)

- 낱말은 **아이들이 날마다 보고 말하는 것**만. 동물·먹을거리·탈것·물건·자연.
  추상어·한자어·초등 교과 낱말(예: 소방관·지우개·태권도)은 넣지 않는다.
- **그림만 보고 바로 알아야 한다.** 그림으로 헷갈리는 낱말(예: '구름'과 '비', '배'(과일)와 '배'(탈것))은
  한쪽만 넣고, 그림에 그 낱말의 뜻이 드러나는 것을 함께 그린다(비 → 구름 + 빗방울, 배 → 물결).
- **몸으로 흉내 낼 수 있어야 한다.** 흉내가 떠오르지 않는 낱말은 그림이 좋아도 넣지 않는다.
- 낱말은 한글 1~5글자(검증이 막는다). 몸짓 힌트는 선생님이 한 번에 읽어 줄 수 있게 40자 안,
  **정답 낱말을 쓰지 않는다**(검증이 막는다 — 읽어 주면 답이 새어 나간다).

## 구조

- `index.html` — 화면 두 개(첫 화면·카드 화면)를 `js/app.js` 가 토글한다
- `js/app.js` — 상태·화면·키보드. **DOM 에 닿는 코드는 여기만.** `TOPICS` 는 검증이 정규식으로 읽는다
- `js/deck.js` — [순수] 카드 뽑기. 한 바퀴 다 돌기 전엔 같은 카드 안 나옴, 같은 그림 연속 금지
- `js/sound.js` — Web Audio 합성 효과음(음원 파일 0개)
- 낱말을 소리로 읽어 주지 않는다 — 소리는 효과음뿐이다(2026-11-12 선생님 결정으로 `speak.js`·[🔊 이름 듣기]를 지웠다).
  다시 넣지 않는다.
- `data/cards.json` — 카드 단일 소스 `{ id, word, topic, hint }`. `id` 가 그림 파일 이름이다
- `assets/cards/<id>.svg` — 카드 그림. 아래 그림 규칙
- `sw.js` — network-first. 카드 그림을 전부 미리 받는다. 카드·모듈을 더하면 `ASSETS` 에도 더한다(검증이 막는다)

놀이 두 가지가 같은 카드 화면을 쓴다.
- **몸으로 말해요**(`gesture`) — 그림+낱말을 띄운다. 한 친구가 화면을 등지고, 나머지가 몸으로 알려 준다.
  [💡 몸짓 힌트]는 흉내를 모르는 아이를 위해 선생님이 펼친다.
- **무엇일까요?**(`guess`) — 그림만 띄우고 다 같이 이름을 외친다. [정답 보기]에 글자가 나타난다.

## 그림 규칙 — 같은 그림체

새 카드를 그릴 때 기존 그림과 나란히 놓고 본다. 하나만 튀면 아이들 눈에 바로 걸린다.

- `viewBox="0 0 240 240"`, 배경 없이 그 물건 하나만 크게(가장자리 여백 약 12px)
- 테두리: `stroke="#3B2F2F" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"` (최상위 `<g>`)
- 색은 정해 둔 것만 — 빨강 `#F25C54` · 주황 `#FF9F43` · 노랑 `#FFD93D` · 연두 `#7CCB5B` · 하늘 `#74C0FC` ·
  파랑 `#4D8EF0` · 보라 `#B197FC` · 분홍 `#FFB5C2` · 갈색 `#A86B3C` · 살구 `#F2D3A8` · 회색 `#B9C3D0` · 흰색
- 눈은 진갈색 점 + 흰 반짝임, 볼은 분홍 타원(반투명). 표정은 늘 웃는 얼굴
- 겹친 도형 안쪽 선을 지우려면 같은 도형을 `stroke="none"` 으로 한 번 더 덮는다(원숭이·개구리·나무 참고)
- **그림 안에 글자(`<text>`)를 넣지 않는다** — `<img>` 로 넣은 SVG 는 웹폰트를 못 쓴다. 외부 주소·스크립트 금지
- 그린 뒤 반드시 **화면에 띄워 눈으로 본다**(크로미움으로 모아 찍기). 좌표만 보고 "됐다"고 하지 않는다

## 검증

```bash
cd kinder && npm test   # 카드 뽑기 테스트 + validate-data + check-font-coverage
```

화면 글자는 Pretendard 서브셋에 있는 것만 쓴다(주석 포함). 예: '뭘'·'뻥' 은 서브셋에 없어
'무엇일까요'·'힘껏' 으로 바꿨다. 서브셋을 다시 만들면 **일곱 사이트가 모두 다시 발행**되므로
낱말 쪽을 맞추는 것이 먼저다.

**헤더에 자매 사이트 바로가기(짬짬이게임·퀴즈… 전체보기)를 달지 않는다** — 유치원 전용이라 필요 없다
(2026-11-12 선생님 결정). `shared/jjam-switcher.js` 는 공통 파일 동기화(`sync-shared` 의 TARGETS) 때문에
폴더에 남아 있을 뿐 `index.html` 이 불러오지 않는다. 다시 걸지 않는다.

상류에서 받아오는 파일은 손으로 고치지 않는다 — `shared/jjam-switcher.js`,
`scripts/check-font-coverage.mjs`, `assets/fonts/*`. 루트에서 `node scripts/sync-shared.mjs`.
`og-image.svg`·`og-image.png` 는 루트 `scripts/gen-og.mjs` 가 `favicon.svg` 에서 만든다.
**gen-og 를 돌리면 다른 사이트의 og-image.png 도 다시 구워진다** — `kinder/` 것만 남기고
나머지는 `git checkout` 으로 되돌려야 한다(안 그러면 그 사이트들이 다시 발행된다).

## 한 파일 묶음 — 카톡으로 파일 하나 보내기

```bash
cd kinder && npm run single   # → dist/짬짬이유치원.html (약 500KB)
```

`scripts/build-single.mjs` 가 index.html·css·js·카드 목록·그림·폰트를 HTML 하나에 담는다.
받은 사람이 더블클릭(file://)으로 열어 인터넷 없이 논다 — 서비스워커·manifest 는 빠진다.
**원본은 사이트 파일이다.** 결과물(`dist/`, 커밋 안 함)은 손으로 고치지 않고 사이트를 고친 뒤 다시 만든다.
app.js 의 import·fetch·그림 경로 모양을 바꾸면 스크립트가 바꿔 넣을 자리를 못 찾아 **멈춘다** —
그때는 스크립트를 함께 맞춘다(조용히 깨진 파일이 나가지 않게 일부러 멈추게 했다).
폰트 검사가 이 결과물을 두 번 세지 않게 `font-scan-ignore.txt` 에 적어 두었다.
휴대폰 카톡 미리보기는 스크립트를 안 돌릴 수 있다 — PC 에 저장해 브라우저로 여는 것이 확실하다.

## 아직 발행되지 않는다 — 발행 저장소를 만드는 순서

주소가 저장소 이름에서 나오므로(`github.io/<레포>/`) 발행 저장소가 따로 있어야 한다.
루트 CLAUDE.md 의 "배포·발행에 닿는 변경" 규칙을 그대로 따른다. 순서:

1. GitHub 에 빈 저장소 `shway81-droid/jjam-kinder` 를 만든다(선생님이 직접 — 세션에서 만들 수 없다).
2. `kinder/` 가 jjam-classroom **main 에 머지돼 있어야 한다** — 발행 워크플로가 main 의 `kinder/` 를 받아 간다.
   (`kinder/` 머지는 어디에도 발행되지 않으니 먼저 해도 안전하다.)
3. `docs/jjam-kinder-publish.yml` 을 `jjam-kinder` 의 `.github/workflows/publish.yml` 로 둔다(jjam-draw 의 것을 본떴다).
   `repository_dispatch: classroom-published` 를 받아 `kinder/` 를 가져와 `actions/deploy-pages` 로 올리고,
   `sw.js` 의 `CACHE` 를 `jjam-kinder-<커밋 번호>` 로 바꾼다. 배포 목록은 그 파일에 있다.
4. `jjam-kinder` Settings → Pages → Source 를 **GitHub Actions** 로(main 브랜치 발행 금지 — 2026-09-30 사고).
5. `PUBLISH_TOKEN` 에 `jjam-kinder` 를 더한다.
6. `jjam-kinder` 에서 Run workflow 로 한 번 발행하고
   `https://shway81-droid.github.io/jjam-kinder/sw.js` 의 `CACHE` 가 커밋 번호인지, 화면이 뜨는지 확인한다.
7. 확인한 뒤에야 `publish-dispatch.yml`(`paths`·`grep`·`repo_of`·손 실행 목록)·`publish-keepalive.yml`·
   `token-expiry` 안내·루트 CLAUDE.md 확인 명령(아홉 줄)에 더한다.
8. 헤더 바로가기(`game/shared/jjam-switcher.js` 의 `SITES`)와 모아보기(`home/`)에 거는 것은 **마지막에,
   따로** 한다 — 바로가기를 바꾸면 일곱 사이트가 모두 다시 발행된다.
