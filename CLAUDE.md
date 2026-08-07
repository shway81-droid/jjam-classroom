# 짬짬이 교실 — 작업 규칙 (Claude용)

다섯 사이트를 한 저장소에 모은 곳이다. **폴더 하나가 사이트 하나다.**

```
game/   퀴즈 아닌 미니게임 105종      quiz/   문답형만 모은 자매 버전
video/  짧은 교육 영상                story/  생각하고 말하기
word/   입으로 외치는 말놀이
```

## 폴더 안의 규칙이 우선이다

`game/CLAUDE.md` 와 `word/CLAUDE.md` 가 그대로 살아 있다. 그 폴더에서 일할 때는
**그 파일이 이 파일보다 우선한다.** 규칙이 서로 다르기 때문이다 — 예를 들어
게임은 `shared/style.css`·`shared/engine.js` 수정 금지이고, 낱말은 초성퀴즈
`prompt` 를 겹자음 그대로 써야 한다. 한쪽 규칙을 다른 쪽에 적용하면 사고가 난다.

규칙을 통일하지 마라. 저장소를 합친 것이지 제품을 합친 것이 아니다.

## 지금 배포는 기존 저장소가 한다 — 갈라짐 주의

| 사이트 | 발행 중인 저장소 | 발행 방식 |
|---|---|---|
| `game/` | `shway81-droid/jjam` | `gh-pages` 브랜치 (`pages.yml`), 배포 시 `sw.js` 캐시 이름을 커밋 SHA 로 치환 |
| `quiz/` | `shway81-droid/jjam-quiz` | 레포 설정에서 main 루트 직접 발행 |
| `video/` | `shway81-droid/jjam-video` | Actions 소스 (`actions/deploy-pages`) |
| `story/` | `shway81-droid/jjam-story` | 레포 설정에서 main 루트 직접 발행 |
| `word/` | `shway81-droid/jjam-word` | 레포 설정에서 main 루트 직접 발행 |

주소가 저장소 이름에서 나오기 때문에(`github.io/<레포>/`) 여기서 발행하면
선생님들의 즐겨찾기가 전부 깨진다. 그래서 배포는 아직 저쪽에 있다.

**그래서 소스가 두 곳이다.** 어느 쪽을 고칠지 정해지기 전까지는 내용이 갈라질 수
있다. 사용자가 정하기 전에는 **한쪽만 고치고 반대쪽도 맞췄는지 반드시 확인해라.**
선택지는 둘이다.

1. **이 저장소를 소스로** — 여기서 고치고, 배포 워크플로가 결과물을 기존 다섯 곳에
   밀어 넣는다. 기존 저장소는 사람이 손대지 않는 발행 대상이 된다.
2. **기존 저장소를 소스로** — 여기는 읽기용 모음이 된다. 그러면 합친 의미가 거의 없다.

## 검증

사이트마다 명령이 다르다. 저장소가 갈라져 있던 시절 그대로이고, 통일하지 않았다.

```bash
cd game  && npm test
cd quiz  && npm test
cd word  && npm test
cd video && node scripts/validate-data.mjs && node scripts/gen-data.mjs --check && node scripts/check-font-coverage.mjs
cd story && node scripts/validate-data.mjs && node scripts/check-font-coverage.mjs
```

CI 는 `.github/workflows/{game,quiz,video,story,word}.yml` 다섯 벌이고 각각
**경로 필터**가 걸려 있다. 필터를 지우지 마라 — 지우면 낱말 문항 하나를 고쳐도
게임 105종 검증이 따라 돌아 커밋 하나에 수십 분이 걸린다.

**위 명령은 정적 검증이다 — "게임이 실제로 돌아가는가"는 안 본다.** 그건
`game-browser.yml`·`quiz-browser.yml` 이 크로미움으로 실제 플레이해서 확인한다
(PR 은 건드린 게임만, main 푸시·월요일은 전체). 게임 로직을 고쳤다면 로컬에서도
돌려 봐라.

```bash
cd game && npm run verify:browser -- <게임폴더명>
cd game && npm run verify:browser -- --all      # 십수 분
```

`△` 는 실패가 아니다 — 조작 방식이 달라 끝까지 자동 플레이가 안 되는 게임이며,
로딩·PLAY·게임화면 진입·콘솔 에러 0 까지는 확인된 것이다.

## 폴더 안의 `.github/` 는 동작하지 않는다

`game/.github/workflows/` 같은 중첩 워크플로가 그대로 남아 있다. GitHub Actions 는
저장소 **루트**의 `.github/workflows/` 만 읽으므로 이것들은 돌지 않는다.
합치기 전 원본과 대조하려고 남겨 둔 사본이다.

단, `shared-sync.yml` 과 `scripts/sync-shared.mjs` 는 **지웠다.** 나머지 사본과 달리
이 둘은 적극적으로 틀린 곳을 가리켰다 — 얼어 있는 `shway81-droid/jjam` 저장소에서
공통 파일을 받아오는 장치였고, 실수로 돌리면 옛 내용으로 덮어썼을 것이다.
지금 맞는 장치는 루트의 `scripts/sync-shared.mjs` 하나뿐이다.

`browser.yml` 도 사본이 남아 있지만, 그 검사 자체는 루트의 `game-browser.yml`·
`quiz-browser.yml` 로 살아 있다.

## 공통 파일 — `game/` 한 곳에서만 고친다

다섯 폴더에서 글자 하나까지 같아야 하는 파일이 다섯 개 있다.

```
shared/jjam-switcher.js          헤더의 자매 사이트 바로가기
scripts/check-font-coverage.mjs  폰트 커버리지 검증
assets/fonts/PretendardVariable.subset.woff2
assets/fonts/coverage.txt
assets/fonts/LICENSE.txt
```

**상류는 `game/` 이다.** 여기서 고치고 아래를 돌리면 나머지 넷이 따라온다.

```bash
node scripts/sync-shared.mjs           # game/ 내용으로 맞춘다
node scripts/sync-shared.mjs --check   # 어긋난 곳만 알려 준다 (CI 가 이걸 돌린다)
```

`quiz/`·`video/`·`story/`·`word/` 안의 이 다섯 파일은 **생성물이다. 손으로 고치지
마라.** 고쳐도 CI(`공통 파일 일치 확인`)가 막고, 다음 동기화 때 덮어써진다.

왜 한 벌로 줄이지 않았나 — 폰트와 스위처는 각 사이트가 **배포될 때 자기 루트에**
갖고 있어야 한다. 저장소 루트에 한 벌만 두면 `game/index.html` 의
`shared/jjam-switcher.js` 경로가 안 맞고, `../shared/` 로 바꾸면 배포된 사이트에서
사이트 루트를 벗어나 404 가 난다. 심링크나 빌드 단계를 쓰면 되지만 이 프로젝트는
**빌드 단계 없음**이 원칙이다. 그래서 파일은 다섯 벌로 두되 손대는 곳을 하나로 줄였다.

`game/shared/style.css` 와 `game/shared/engine.js` 는 **공통이 아니다** — 게임 전용이고
`SHARED` 목록에 없다.

바로가기에 걸린 곳은 완성된 다섯뿐이다. 쉼·스트레칭·그리기는 작업 중이라 넣지 않는다.

## PR 워크플로

브랜치 → PR → CI 통과 → **squash** 머지. 기존 저장소들의 관례와 같다.
