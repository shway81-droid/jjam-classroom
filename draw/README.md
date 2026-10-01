# 짬짬이 그리기

교사가 그림 하나를 고르면, 화면이 완성까지의 선을 한 획씩 차례로 보여 주어
학생들이 각자 종이에 따라 그릴 수 있게 하는 전자칠판용 웹서비스입니다.

> 교사는 시작만 누르고, 화면이 한 획씩 이끈다. 비뚤어도 완성되면 그럴듯하다.

요구사항은 [짬짬이_그리기_PRD.md](짬짬이_그리기_PRD.md)에 있습니다. 이 README는 실행 방법만 적습니다.

## 실행

```bash
npm run dev      # http://localhost:4173
npm test         # 그림 데이터 전수 검증 (PRD 9장) + 음성이 지금 멘트로 만든 것인지
npm run draw     # scripts/draw/<id>.mjs → drawings/*/drawing.json → data/drawings.json
npm run voice    # 교사 멘트 음성 → audio/<목소리>/*.mp3, data/voice.json (바뀐 그림만)
```

빌드 단계가 없습니다. `npm run dev`는 확인용 정적 서버이고, 배포는 GitHub Pages입니다.

## 조작

시작을 누른 뒤에는 교사 조작이 없습니다(자동 모드). 필요할 때만 씁니다.

| 키 | 동작 |
|---|---|
| `Space` `→` `PageDown` `Enter` | 다음 획 |
| `←` `PageUp` | 한 획 뒤로 (자동 진행도 함께 멈춤) |
| `R` | 방금 획 다시 보기 (그 단계 타이머도 처음부터) |
| `S` | 교사 멘트 다시 듣기 |
| `P` | 자동 진행 멈춤·재개 |
| `1` `2` `3` | 느리게 · 보통 · 빠르게 (지금 단계의 남은 시간에 바로 적용) |
| `C` | 완성본 잠깐 보기 (누르고 있는 동안만) |
| `F` | 전체화면 |
| `Esc` | 나가기 — 화면 안 확인에서 `Enter` 나가기 · `Esc` 계속하기 |

프레젠터 리모컨의 `PageUp`·`PageDown`을 받습니다. 글자 키는 `e.code`로 읽어
한글 입력 상태에서도 동작합니다.

## 그림 추가·고치기

1. 참조 선화를 `refs/<id>.png`에 둡니다(그림책 스타일의 굵은 검은 선화).
2. `scripts/draw/<id>.mjs`에 지나가는 점을 적습니다. 예시는 `cat-face.mjs`, 작업대는 `lib.mjs`입니다.
   열린 획의 양 끝은 앞 획 위에 계산으로 붙으므로 떠 있는 획이 생기지 않습니다.
   - `node scripts/draw/ref-place.mjs <id> <portrait|landscape> /tmp/ref.png` — 참조 선화를 격자 밑판으로
   - `node scripts/draw/overlay.mjs /tmp/ref.png /tmp/over.png drawings/<id>/drawing.json` — 밑판 위에 획 겹쳐 보기
   - `node scripts/draw/render.mjs /tmp/final.png <id>` — 굵은 선 완성본
   - `node scripts/floating.mjs <id>` — 떠 있는 획 0개인지
3. `drawings/list.json`에 id를 넣고 `npm run draw && npm run voice && npm test`
4. `tools/compare.html`·`tools/sheet.html`에서 누적 형태를 눈으로 봅니다 — 기계로 판정할 수 없는 마지막 관문입니다.

`scripts/draw/<id>.mjs`가 원본입니다. `drawings/<id>/drawing.json`·`data/drawings.json`·`data/voice.json`은
파생물이고, 어긋나면 `npm test`가 잡습니다.

## 교사 멘트 음성

준비 화면은 준비 안내(종이 방향·첫 획 크기)를, 따라 그리기 화면은 단계마다 신호음 뒤에 교사 멘트를 읽어 줍니다.
준비 화면의 **소리**(읽어 주기·신호음만·끔)와 **목소리**(여자·남자)로 고릅니다.

- 음성은 [Supertonic 3](https://huggingface.co/Supertone/supertonic-3)(Supertone, OpenRAIL-M)로 미리 만든 MP3입니다.
  이 컴퓨터에서 만들어 키·사용량 제한이 없습니다. 처음 한 번 `pip install supertonic soundfile`, `ffmpeg`가 필요합니다.
- 그림 하나 · 목소리 하나가 파일 하나이고(문장 사이 무음), 문장 구간은 `data/voice.json`에 있습니다.
  파일 이름에 멘트 해시가 들어 있어 멘트를 고친 그림만 다시 만들어집니다.
- **멘트를 고치면 `npm run voice`를 돌려야 `npm test`가 통과합니다.**
- `python3 scripts/voice/verify.py`는 음성을 받아쓰기(Whisper)해 원문과 다르게 읽은 문장을 찾습니다.
- 고른 목소리의 음성은 화면이 뜬 뒤 뒤에서 받아 저장합니다(약 3.8MB). 아직 못 받았으면 기기 음성으로 대신 읽습니다.
- 라이선스 조건에 따라 준비 화면에 AI 음성임을 밝힙니다.

## 폴더

```
index.html  css/  js/          앱 (HTML·CSS·바닐라 JS)
scripts/draw/<id>.mjs          그림 원본 — 참조 선화를 따라 적은 점
refs/<id>.png  refs/<id>.svg   AI 참조 선화와 potrace 벡터화 (배포 제외)
drawings/<id>/drawing.json     그림 데이터 — 하나가 파일 하나
drawings/list.json             그림 순서
data/drawings.json             통합본 (앱이 읽는 1요청)
data/voice.json  audio/        교사 멘트 음성 목록과 MP3
scripts/validate.mjs           PRD 9장 전수 검증 (의존성 없음)
scripts/floating.mjs           떠 있는 획 측정
scripts/voice/                 음성 생성·받아쓰기 확인 (Python)
scripts/bundle.mjs             통합본 생성
scripts/serve.mjs              확인용 정적 서버
tools/compare.html             지금 그림 · 참조 · 새 그림 비교 (배포 제외)
tools/author.html              획 저작 도구        (배포 제외)
tools/sheet.html               단계 검토 시트      (배포 제외)
tools/favicons.html            가족 아이콘 비교    (배포 제외)
sw.js  manifest.webmanifest    오프라인 (PWA)
```

## 배포

`main`에 올리면 `.github/workflows/pages.yml`이 `npm test`를 돌리고 GitHub Pages에 올립니다.
`tools/`·`drawings/`·`refs/`·`scripts/`는 배포에 들어가지 않습니다.

저장소 설정에서 **Pages → Source 를 GitHub Actions** 로 한 번 바꿔 주어야 합니다.

## 오프라인

PWA는 **한 번은 온라인에서 열어야** 캐시가 생깁니다. 캐시가 끝나면 홈의 안내문이
`준비 끝 — 이제 인터넷 없이도 됩니다.`로 바뀝니다. 교실에 들고 가기 전에 한 번 열어 두세요.
