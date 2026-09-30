# 짬짬이 낱말 (jjam-word)

보기 없이 반 전체가 입으로 외치는 전자칠판용 말놀이. 정적 SPA.
짬짬이 게임의 자매 사이트 — 헤더 바로가기의 여섯(게임·퀴즈·영상·이야기·낱말·1분 수업) 중 하나.
`jjam-classroom` 저장소의 `word/` 폴더이고, 발행만 `shway81-droid/jjam-word` 가 한다.

## 구조

- 빌드 도구 없음. Vanilla HTML/CSS/JS(ES modules). GitHub Pages(main 루트) 배포.
- `index.html` — 화면 6개를 섹션으로 두고 `js/app.js` 가 토글한다(해시 라우팅 없음)
- `js/app.js` — 부트스트랩·상수(TYPES/LEVELS/TOPICS)·상태 머신·키보드. **DOM 에 닿는 코드는 여기만**
- `js/pick.js` — [순수] 후보 필터 + 출제 선택 (최근 50개 제외, 소진 시 초기화, 주제 3연속 회피)
- `js/store.js` — localStorage (`jjam-word:recent:<type>`, `jjam-word:muted`, `jjam-word:today`)
- `js/sound.js` — Web Audio 합성 (음원 파일 0개). 음소거는 master gain 한 곳
- `js/chain.js` — [순수] 끝말잇기 차례 진행 규칙 (불변 객체). 교사가 낱말을 적는 것은 선택이고,
  적으면 다음 글자(두음법칙)·이미 나온 말을 알려 주기만 한다 — Enter 한 번 더면 인정. 입력칸 안에서는
  단축키(Space·P)를 쓰지 않는다(한글 ㅔ 가 잠깐으로 새지 않게). 놀이 중 기록은 이어진 말 한 줄(넘치면 앞을 … 으로),
  판이 끝나면 타이머 링 자리에 이어진 말 전부를 펼친다 — 놀이 중에 전부 띄우면 버튼이 밀리고 글자가 작아진다
- `js/clock.js` — [순수] 수업 타이머(상단바, 1~5분). 놀이에 속하지 않아 화면을 바꿔도
  이어서 흐른다. 끝말잇기 차례 타이머(`chain.js`)와는 다른 물건이다
- `data/words.json` — 단일 소스 1837개: 문항 1457(인물 193 포함) + 끝말잇기 시작단어 120
  + 몸으로말해요 카드 200 + 줄줄이 말해요 제시 글자 60
- `assets/people/` — 인물퀴즈 사진(WebP, 긴 변 720px — 원본이 그보다 작으면 원본 크기. 2026-09-30 에 480px 에서 올렸다). 한 장도 손으로 넣지 않는다 — 아래 규칙
- `people.html`·`js/people.js`·`css/people.css` — 인물퀴즈 **전체 정답 리스트**(선생님용, 2026-09-30).
  인물퀴즈 설정 화면의 버튼이 새 창으로 연다. `words.json` 을 그대로 읽어 분야별로 보여 주고
  CSV(BOM, 영문 파일 이름 — 한글 이름은 브라우저에 따라 확장자 없는 'download' 로 저장된다)·인쇄를 준다
- `sw.js` — network-first 서비스워커 (콘텐츠 갱신과 오프라인을 함께).
  `js/` 에 모듈을 더하면 `ASSETS` 에도 더한다 — 빠지면 오프라인 첫 실행에서 앱이 안 뜬다
  (`scripts/sw.test.mjs` 가 막는다)

## 규칙

- `npm test` 필수 통과 = `node --test` + `validate-data` + `check-font-coverage`.
  PR·main 푸시마다 저장소 루트의 `.github/workflows/word.yml` 이 같은 명령을 돌린다.
  이 폴더 안의 `.github/workflows/verify.yml` 은 합치기 전 사본이라 돌지 않는다
- 외부 이미지·영상·폰트 CDN·JS 라이브러리 의존 금지 (오프라인·저작권)
- **상류에서 받아오는 파일은 직접 고치지 않는다** — `shared/jjam-switcher.js`,
  `scripts/check-font-coverage.mjs`, `assets/fonts/*`.
  상류는 이제 `jjam-classroom` 의 **`game/` 폴더**다. 거기서 고친 뒤 저장소 루트에서
  `node scripts/sync-shared.mjs` 를 돌린다 (예전의 `npm run sync:shared` 는 없어졌다)
- 브랜드 색 원값은 `css/style.css` 의 `--accent` **한 곳뿐**. 나머지는 `color-mix` 로 파생된다
- 아이콘 단일 소스는 `favicon.svg`. PNG 는 `npm run icons` 로 생성
- `js/app.js` 의 TYPES/LEVELS/TOPICS 는 `scripts/validate-data.mjs` 가 정규식으로 읽어 간다.
  상수 이름이나 형태를 바꾸면 검증도 함께 고쳐야 한다 (안 고치면 통과가 아니라 실패한다)
- 문항 추가 시 안전 기준(PRD 3절)과 난이도 분포를 지킨다 — 검증이 강제한다.
  금칙어 표는 `scripts/banned.mjs`, 오탐/탐지 사례는 `scripts/banned.test.mjs` 에 고정돼 있다
- 몸으로 말해요에는 **'나라' 주제를 두지 않는다.** 나라 흉내는 민족 비하 몸짓으로 번지기 쉽다.
  `validate-data.mjs` 의 `EXCLUDED_TOPICS` 가 빈 주제 경고에서 빼고, 문항이 들어오면 실패시킨다
- 화면 글자는 Pretendard 에 있는 것만 쓴다(주석 포함 — 검사가 소스 전체를 읽는다).
  `⏸`·`⏱`·`─` 는 원본 폰트에 없어 `‖`·'초과'·`—` 로 바꿨다
- 초성퀴즈 `prompt` 는 정답에서 기계적으로 나온 초성이어야 한다 — **겹자음 그대로**
  (토끼 → `ㅌㄲ`). 초기 계획은 홑자음으로 펴는 것이었으나 뒤집혔다: 화면이 아이들에게
  틀린 초성을 가르치면 안 된다. 초성이 욕설로 읽히는 낱말은 `CHOSEONG_BANNED` 로 막는다
- **지구오락실 말놀이**(홈의 두 번째 묶음, TYPES 의 `arcade: true`) — 4글자 이어말하기(`fourword`)·
  인물퀴즈(`person`)·줄줄이 말해요(`relay`). 줄줄이 말해요는 끝말잇기 판(`chain.js`·끝말잇기
  화면)을 그대로 쓰고 제시어만 다르다(`ROUND_TYPES`). 묶음 제목만 선생님 요청(2026-09-28)으로
  '지구오락실 말놀이'라 부른다. 놀이 이름·설명 문구에는 방송 이름을 더 넣지 않는다.
  4글자 이어말하기의 빈칸은 속담처럼 `______` 을 그대로 그리지 않고 정답 글자 수만큼
  한 칸씩 끊어 그린다(`slotBlank`) — 긴 밑줄은 뒤에 글자가 많아 보인다
- 인물퀴즈 사진은 **위키미디어 공용의 자유 라이선스만** 쓴다(CC0·퍼블릭 도메인·CC BY·
  CC BY-SA·공공누리 1유형). 언론사·소속사 사진은 아무리 흔해도 쓰지 않는다. 사진마다
  `photo.{file,author,license,source}` 를 적고, 정답 화면이 출처를 밝힌다(라이선스 조건).
  검증이 라이선스·출처 주소·파일 존재·안 쓰는 사진을 막는다. 자유 사진이 없는 인물은 넣지 않는다.
  정치인·논란이 있는 인물·미성년 때 사진은 넣지 않는다. 인물 분야는 `PERSON_TOPICS` 로
  낱말 주제(`TOPICS`)와 따로 둔다
- 인물 사진은 `sw.js` 가 미리 받지 않는다(첫 방문이 몇 MB 가 된다). 한 번 본 사진만
  캐시에 남고, 오프라인에서 못 불러오면 화면이 힌트를 바로 연다
- **외쳐라 말놀이 뒤쪽 넷**(2026-09-28) — 반대말 외치기(`opposite`)·흉내 내는 말(`mimetic`)·
  맞춤법 고치기(`spelling`)·글자 뒤섞기(`scramble`). 낱말 하나만 띄우면 무엇을 외칠지 모르므로
  TYPES 의 `cue`('반대말은?' 등)를 문제 위 작은 띠에 주제와 함께 띄운다.
  반대말·흉내 내는 말의 힌트는 정답의 초성(검증이 강제). 흉내 내는 말은 속담처럼 빈칸을 채운다.
  글자 뒤섞기는 초성퀴즈의 세 글자 이상 낱말을 섞어 만들었다 — 검증이 "같은 글자, 다른 순서"를 확인한다.
  맞춤법은 **틀린 표기를 화면 가득 띄우는 놀이**라 표준어 근거가 확실한 것만 넣는다
- 문항당 교사 조작은 **최대 3회**(문제→힌트→정답). 자동 진행 없음 — 외침을 기다려야 한다
- PR 워크플로: 브랜치 → PR → CI 통과 → squash 머지

## 환경 주의

- 저장소 안 줄바꿈은 항상 LF(`.gitattributes`). 안 그러면 공통 파일이 CRLF 로
  바뀌어 `공통 파일 일치 확인` 이 영구히 이탈을 보고한다

  (예전에는 `raw.githubusercontent.com` 이 이 환경에서 ECONNRESET 으로 끊겨
  `gh api` 우회가 필요했다. 저장소를 합친 뒤로는 공통 파일을 네트워크로 받지
  않고 `game/` 폴더에서 복사하므로 그 문제 자체가 없어졌다.)

## 원본 문서

- 요구사항: `짬짬이_낱말_PRD.md`
- 구현 계획: `docs/superpowers/plans/2026-07-29-jjam-word-mvp.md`
