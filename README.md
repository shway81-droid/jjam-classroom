# 짬짬이 교실

수업 자투리 시간(1~5분)에 전자칠판으로 바로 쓰는 초등 수업 도구 모음입니다.
설치도 로그인도 없이 브라우저에서 열고, 인터넷이 끊겨도 동작합니다.

**완성된 다섯 개를 이 저장소 하나에 모았습니다.** 그 전에는 저장소가 다섯으로
갈라져 있어서, 공통 파일 한 줄을 고치려면 PR 을 다섯 번 머지해야 했습니다.

| 폴더 | 이름 | 하는 일 | 바로 하기 |
|---|---|---|---|
| `game/` | 짬짬이 게임 | 미니게임 105종 | https://shway81-droid.github.io/jjam/ |
| `quiz/` | 짬짬이 퀴즈 | 문답형 게임만 모은 자매 버전 | https://shway81-droid.github.io/jjam-quiz/ |
| `video/` | 짬짬이 영상 | 짧은 교육 영상 고르기 | https://shway81-droid.github.io/jjam-video/ |
| `story/` | 짬짬이 이야기 | 생각하고 말하기 (3~7분) | https://shway81-droid.github.io/jjam-story/ |
| `word/` | 짬짬이 낱말 | 반 전체가 입으로 외치는 말놀이 | https://shway81-droid.github.io/jjam-word/ |

작업 중이라 여기 없는 것 — 짬짬이 쉼(`jjam-rest`) · 스트레칭(`jjam-stretch`) ·
그리기(`jjam-draw`). 완성되면 이 저장소로 들어옵니다.

## 실행

빌드 단계가 없습니다. 폴더에서 정적 서버를 띄우면 그게 전부입니다.

```bash
cd game        # 또는 quiz / video / story / word
python -m http.server 8000
```

## 검증

사이트마다 검증 명령이 다릅니다. 저장소가 갈라져 있던 시절의 관례를 그대로
가져왔고, 통일하지 않았습니다 — 통일한다며 손대면 지금 도는 검증이 깨집니다.

```bash
cd game  && npm test    # 파생 메타 동기화 + 폰트 커버리지 + 게임 105종 정적 검증
cd quiz  && npm test
cd word  && npm test    # node --test + 데이터 검증 + 폰트 커버리지
cd video && node scripts/validate-data.mjs && node scripts/gen-data.mjs --check && node scripts/check-font-coverage.mjs
cd story && node scripts/validate-data.mjs && node scripts/check-font-coverage.mjs
```

CI 도 같은 명령을 돌립니다. `.github/workflows/` 에 사이트별로 한 벌씩 있고
**경로 필터**가 걸려 있어, 바뀐 폴더의 검증만 돕니다. 필터가 없으면 낱말 문항
하나를 고쳐도 게임 105종 검증이 따라 돕니다.

## 배포는 아직 기존 저장소에서 합니다

위 표의 주소는 **지금도 기존 저장소 다섯 곳이 서비스하고 있습니다.**
GitHub Pages 의 주소가 저장소 이름에서 나오기 때문입니다 —
`github.io/jjam-quiz/` 의 `jjam-quiz` 가 곧 저장소 이름입니다. 여기서 발행하면
주소가 `github.io/jjam-classroom/quiz/` 로 바뀌고, 선생님들이 즐겨찾기에 넣어 둔
주소가 전부 깨집니다.

그래서 이 저장소는 **소스**만 맡고, 배포는 기존 다섯 곳이 그대로 맡습니다.
아직 두 곳이 살아 있으니 **어느 쪽을 고칠지 정해 두지 않으면 내용이 갈라집니다.**
정하는 방법은 `CLAUDE.md` 에 적었습니다.

## 각 사이트 문서

폴더마다 원래의 `README.md` 가 그대로 있습니다. 게임과 낱말은 `CLAUDE.md` 도
따로 있고, 그 안의 규칙이 우선입니다.

- `game/README.md` · `game/CLAUDE.md`
- `quiz/README.md`
- `video/README.md`
- `story/README.md` · `story/짬짬이_이야기_PRD.md`
- `word/README.md` · `word/CLAUDE.md` · `word/짬짬이_낱말_PRD.md`
