# 짬짬이 교실 — 작업 규칙 (Claude용)

일곱 사이트를 한 저장소에 모은 곳이다. **폴더 하나가 사이트 하나다.**

```
game/   퀴즈 아닌 미니게임 105종      quiz/   문답형만 모은 자매 버전
video/  짧은 교육 영상                story/  생각하고 말하기
word/   입으로 외치는 말놀이          1min/   교과서 차시를 1분 영상으로
draw/   한 획씩 따라 그리기 (2026-10-01 합류)
home/   짬짬이 교실 모아보기 — 일곱 사이트를 모은 첫 화면 (2026-10-01)
```

## ⛔ 배포·발행에 닿는 변경 — 반드시 지킨다 (2026-09-30 사고)

2026-09-30, 발행 저장소를 깨우려고 main 에 기록 파일 하나를 커밋했다가 **퀴즈·이야기·낱말
세 사이트가 한참 전 옛 화면으로 돌아갔다.** 세 저장소의 Pages 설정이 "main 브랜치에서 발행"이라
커밋 하나가 옛 내용 전체를 다시 발행시켰다. 이 표(아래 "지금 배포는…")에 이미 적혀 있던 사실을
확인하지 않은 것이 원인이다. 선생님들이 수업 중에 쓰는 사이트다 — 다음 규칙은 예외 없다.

1. **발행 대상 저장소(jjam · jjam-quiz · jjam-video · jjam-story · jjam-word · jjam-1min · jjam-draw)에
   무엇이든 쓰기 전에** 그 저장소가 어떻게 발행되는지(Pages Source, 워크플로) 먼저 확인한다.
   "이 파일은 사이트와 무관하다"고 단정하지 않는다 — **커밋이 생기는 것 자체가 발행을 일으킬 수 있다.**
2. **여러 저장소·여러 사이트에 한꺼번에 적용하지 않는다.** 한 곳에 먼저 적용하고, 실제 사이트
   (`https://shway81-droid.github.io/<저장소>/sw.js` 의 커밋 번호, 화면)를 확인한 뒤 나머지로 넓힌다.
3. **발행에 닿는 PR 은 확인을 끝낸 뒤 머지한다.** 가짜 API·문법 검사만으로 "된다"고 하지 않는다.
   확인할 방법이 없으면 머지하지 말고 선생님께 무엇을 확인 못 했는지 말하고 멈춘다.
4. **사고가 나면 먼저 되돌린다.** 일곱 곳에 발행 신호를 다시 보내 최신으로 덮어쓰고
   (jjam-classroom `발행 신호 보내기` 수동 실행, 또는 각 저장소 발행 워크플로 Run workflow),
   일곱 사이트 sw.js 의 커밋 번호가 jjam-classroom main 과 같은지 확인한 다음 원인을 고친다.
5. 확인 명령(일곱 사이트의 발행 버전):
   `for r in jjam jjam-quiz jjam-video jjam-story jjam-word jjam-1min jjam-draw; do curl -s https://shway81-droid.github.io/$r/sw.js | grep -oE "(CACHE(_NAME)?|VERSION) = '[^']*'"; done`
   — 커밋 번호 없이 `jjamquiz-v3` 같은 이름이 나오면 옛 내용이 발행된 것이다.

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
| `quiz/` | `shway81-droid/jjam-quiz` | Pages Source = **GitHub Actions** (`publish.yml` → `actions/deploy-pages`) |
| `video/` | `shway81-droid/jjam-video` | Pages Source = **GitHub Actions** (`publish.yml` → `actions/deploy-pages`) |
| `story/` | `shway81-droid/jjam-story` | Pages Source = **GitHub Actions** (`publish.yml` → `actions/deploy-pages`) |
| `word/` | `shway81-droid/jjam-word` | Pages Source = **GitHub Actions** (`publish.yml` → `actions/deploy-pages`) |
| `1min/` | `shway81-droid/jjam-1min` | Pages Source = **GitHub Actions** (`publish.yml` → `actions/deploy-pages`) |
| `draw/` | `shway81-droid/jjam-draw` | Pages Source = **GitHub Actions** (`publish.yml` → `actions/deploy-pages`). 2026-10-01 합류 — 예전 `pages.yml`(자기 main 발행)은 지웠다. 배포 목록은 `publish.yml` 에 적혀 있다(`tools/`·`drawings/`·`refs/`·`scripts/` 는 배포하지 않는다), sw.js 의 `VERSION` 을 커밋 번호로 |

**`home/` 만 예외다 — 이 저장소가 직접 발행한다.** 주소 `https://shway81-droid.github.io/jjam-classroom/`,
Pages Source = **GitHub Actions**, 워크플로 `.github/workflows/home.yml`. 저장소 전체가 아니라 `home/` 의
`index.html`·`favicon.svg`·`og-image.png`·`assets/` 만 올린다(다른 폴더가 이 주소 아래 한 벌 더 공개되지 않게).
`publish-dispatch.yml`·`publish-keepalive.yml` 과 무관하고 `PUBLISH_TOKEN` 도 쓰지 않는다. 서비스워커가 없어
고치면 새로 고침 없이 바로 보인다. 확인: `curl -s https://shway81-droid.github.io/jjam-classroom/ | grep -o '<title>[^<]*'`.

주소가 저장소 이름에서 나오기 때문에(`github.io/<레포>/`) 여기서 발행하면
선생님들의 즐겨찾기가 전부 깨진다. 그래서 배포는 아직 저쪽에 있다.

**소스는 이 저장소 하나다.** 기존 일곱 곳은 사람이 손대지 않는 발행 대상이다.
거기서 고쳐 봐야 발행이 이곳 내용으로 덮어쓴다.

## 반영은 자동이다

사이트 폴더가 바뀐 채로 `main` 에 머지되면 `publish-dispatch.yml` 이 **바뀐 폴더의
저장소에만** `repository_dispatch`(`classroom-published`)를 보내고, 각 저장소의
`publish.yml` 이 받아 몇 분 안에 발행한다.

신호를 보내려면 다른 저장소를 두드려야 하므로 `PUBLISH_TOKEN` 시크릿(저 일곱
저장소에 대한 Contents 쓰기 권한만 가진 fine-grained PAT)이 필요하다.

`PUBLISH_TOKEN` 에는 일곱 발행 저장소(jjam-draw 포함)가 모두 들어 있어야 한다.

**토큰이 만료돼도 사이트는 죽지 않는다.** `publish-dispatch.yml` 만 빨간불이 되고,
각 저장소의 하루 한 번 크론(KST 새벽 4시대)이 안전망으로 남아 반영이 최대 하루
늦어질 뿐이다.

만료를 모르고 지나가지 않도록 `token-expiry.yml` 이 **매주 월요일**에 확인한다.
토큰으로 API 를 한 번 찔러 응답 헤더(`github-authentication-token-expiration`)에서
만료일을 읽고, **14일 이하로 남으면 이슈를 연다**(이미 열려 있으면 갱신). 토큰을
갱신해 여유가 생기면 그 이슈를 자동으로 닫는다. 이슈 본문 틀은
`.github/token-expiry-issue.md` 에 있다.

**발행 저장소가 잠들지 않게 한다.** 일곱 발행 저장소는 사람이 커밋하지 않으므로, 60일이
지나면 GitHub 가 크론 달린 `publish.yml` 을 통째로 끈다 — 그러면 발행 신호도 받지 못한다.
`publish-keepalive.yml` 이 **매달 2일** 각 저장소에 `.github/keepalive.txt` 를 커밋해
활동 중으로 만든다(`[skip ci]` 라 거기서 검증이 돌지 않는다). "곧 꺼진다"는 메일이 오면
이 워크플로가 실패했는지부터 본다.

**함정(해결됨) — 발행 저장소 main 커밋이 옛 사이트를 올리던 문제.** 2026-09-30 깨워 두기 첫 실행 때
jjam-quiz · jjam-story · jjam-word 가 Pages Source "main 브랜치에서 발행"이어서, keepalive 커밋 하나에
main 에 얼어 있던 옛 내용이 발행됐다. 같은 날 세 저장소의 Source 를 **GitHub Actions** 로 바꿨고
(jjam-1min · jjam-video 는 원래 Actions, jjam 은 `gh-pages` 브랜치), 이제 발행 저장소 main 에 커밋해도
사이트는 바뀌지 않는다. 깨워 두기의 "다시 발행하고 확인" 단계는 안전망으로 남겨 두었다.
**발행 저장소를 새로 만들거나 설정을 건드릴 때는 Source 가 GitHub Actions 인지 꼭 확인한다.**

급하면 각 저장소 Actions 탭의 **Run workflow** 로 직접 발행할 수도 있고,
이 저장소의 `발행 신호 보내기` 를 손으로 돌리면 일곱 곳이 모두 발행된다.

## 검증

사이트마다 명령이 다르다. 저장소가 갈라져 있던 시절 그대로이고, 통일하지 않았다.

```bash
cd game  && npm test
cd quiz  && npm test
cd word  && npm test
cd video && node scripts/validate-data.mjs && node scripts/gen-data.mjs --check && node scripts/check-font-coverage.mjs
cd video && node scripts/check-sources.mjs   # 출처 검증 — 인터넷 필요
cd story && node scripts/validate-data.mjs && node scripts/check-font-coverage.mjs
cd 1min  && node scripts/validate-data.mjs && node scripts/gen-data.mjs --check && node scripts/check-font-coverage.mjs
cd 1min  && node scripts/check-sources.mjs   # 출처 검증 — 인터넷 필요
cd draw  && npm test && node scripts/check-font-coverage.mjs
```

CI 는 `.github/workflows/{game,quiz,video,story,word,1min,draw}.yml` 일곱 벌이고 각각
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

일곱 폴더에서 글자 하나까지 같아야 하는 파일이 다섯 개 있다.

```
shared/jjam-switcher.js          헤더의 자매 사이트 바로가기
scripts/check-font-coverage.mjs  폰트 커버리지 검증
assets/fonts/PretendardVariable.subset.woff2
assets/fonts/coverage.txt
assets/fonts/LICENSE.txt
```

**상류는 `game/` 이다.** 여기서 고치고 아래를 돌리면 나머지 여섯이 따라온다.

```bash
node scripts/sync-shared.mjs           # game/ 내용으로 맞춘다
node scripts/sync-shared.mjs --check   # 어긋난 곳만 알려 준다 (CI 가 이걸 돌린다)
```

`quiz/`·`video/`·`story/`·`word/`·`1min/`·`draw/`·`home/` 안의 이 다섯 파일은 **생성물이다. 손으로 고치지
마라.** 고쳐도 CI(`공통 파일 일치 확인`)가 막고, 다음 동기화 때 덮어써진다.

왜 한 벌로 줄이지 않았나 — 폰트와 스위처는 각 사이트가 **배포될 때 자기 루트에**
갖고 있어야 한다. 저장소 루트에 한 벌만 두면 `game/index.html` 의
`shared/jjam-switcher.js` 경로가 안 맞고, `../shared/` 로 바꾸면 배포된 사이트에서
사이트 루트를 벗어나 404 가 난다. 심링크나 빌드 단계를 쓰면 되지만 이 프로젝트는
**빌드 단계 없음**이 원칙이다. 그래서 파일은 일곱 벌로 두되 손대는 곳을 하나로 줄였다.

`game/shared/style.css` 와 `game/shared/engine.js` 는 **공통이 아니다** — 게임 전용이고
`SHARED` 목록에 없다.

바로가기에 걸린 곳은 완성된 일곱이다 — 게임·퀴즈·영상·이야기·낱말·1분사회·그리기(2026-10-01).
맨 끝에는 모아보기로 가는 **'전체 보기'**(`HOME`)가 붙는다. 1100px 이하에서는 자매 사이트 아이콘을 접고
'전체 보기' 하나만 남기고, 1280px 이하에서는 아이콘의 이름만 숨긴다 — 영상·1분사회 헤더가 눌리지 않게 잡은 폭이다.
쉼·스트레칭은 작업 중이라 넣지 않는다. 사이트를 더 걸 때는
`game/shared/jjam-switcher.js` 의 `SITES`·`ART` 에 한 벌 더하고 `sync-shared` 를 돌린다.

## 공유 카드 — `favicon.svg` 에서 나온다

주소를 카카오톡·슬랙에 붙이면 뜨는 미리보기 그림(`<사이트>/og-image.png`)이다.

```bash
node scripts/gen-og.mjs           # favicon.svg 에서 일곱 벌을 다시 만든다
node scripts/gen-og.mjs --check   # 어긋났는지만 본다 (CI 가 이걸 돌린다)
```

**`og-image.svg`·`og-image.png` 를 손으로 고치지 마라.** 생성물이다.
로고를 바꾸면 `favicon.svg` 만 고치고 위를 돌리면 된다. 예전에는 카드를 따로
손으로 관리해서, 로고를 새로 그린 뒤에도 **공유 미리보기에만 은퇴한 옛 로고**가
한참 남아 있었다. 그래서 파생시키고 CI 에 검사를 걸었다.

PNG 를 굽는 데는 크로미움이 필요하다(`cd game && npm ci`). `--check` 는 SVG 만
대조하므로 브라우저 없이 돈다 — CI 가 가벼운 쪽만 도는 이유다.

**그림 안에 개수를 넣지 마라.** "미니게임 78" 처럼 구워 두면 게임이 늘 때마다
낡는데, 메신저는 카드를 오래 캐시해서 고쳐도 한참 옛것이 보인다. 개수는
`og:description` 글자로만 적는다. 그림을 바꿨으면 `og:image` 주소의 `?v=` 를
올려야 메신저가 다시 받아 간다.

## PR 워크플로

브랜치 → PR → CI 통과 → **squash** 머지. 기존 저장소들의 관례와 같다.
