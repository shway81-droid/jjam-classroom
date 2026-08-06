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

## 폴더 안의 `.github/` 는 동작하지 않는다

`game/.github/workflows/` 같은 중첩 워크플로가 그대로 남아 있다. GitHub Actions 는
저장소 **루트**의 `.github/workflows/` 만 읽으므로 이것들은 돌지 않는다.
지운 것이 아니라 남겨 둔 것이다 — 기존 저장소가 아직 그 워크플로로 배포·동기화를
하고 있어서, 원본과 대조할 때 필요하다.

## 공통 파일

`shared/jjam-switcher.js`(헤더의 자매 사이트 바로가기)와 웹폰트가 다섯 폴더에
한 벌씩 **중복**되어 있다. 합치기 1단계에서는 원본을 글자 하나 안 바꾸고 그대로
옮기는 것이 목적이라 정리하지 않았다.

상류는 `game/shared/jjam-switcher.js` 다. 고칠 때는 다섯 폴더를 함께 맞추고,
**기존 저장소 다섯 곳도 맞춰야 한다**(위 "갈라짐 주의" 참고).

바로가기에 걸린 곳은 완성된 다섯뿐이다. 쉼·스트레칭·그리기는 작업 중이라 넣지 않는다.

## PR 워크플로

브랜치 → PR → CI 통과 → **squash** 머지. 기존 저장소들의 관례와 같다.
