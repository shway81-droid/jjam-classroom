### 표 읽는 법

- `✓` 최신 · `✖` 옛 내용(그 사이트 파일이 바뀌었는데 발행이 안 됐거나, 앞 배포가 다시 올라왔다) · `?` 판정 불가(sw.js 를 못 받음)
- 판정은 `scripts/verify-publish.mjs` 가 합니다. 로컬에서도 같은 표가 나옵니다: `node scripts/verify-publish.mjs`

### 고치는 순서 (루트 CLAUDE.md 4절)

1. **먼저 되돌립니다.** 이 저장소 Actions → `발행 신호 보내기` → Run workflow (여덟 곳 모두 다시 발행).
   한 곳만이면 그 저장소 Actions 에서 발행 워크플로를 Run workflow 합니다.
   - 게임 https://github.com/__OWNER__/jjam/actions
   - 퀴즈 https://github.com/__OWNER__/jjam-quiz/actions
   - 영상 https://github.com/__OWNER__/jjam-video/actions
   - 이야기 https://github.com/__OWNER__/jjam-story/actions
   - 낱말 https://github.com/__OWNER__/jjam-word/actions
   - 수업영상 https://github.com/__OWNER__/jjam-1min/actions
   - 그리기 https://github.com/__OWNER__/jjam-draw/actions
   - 그림책 https://github.com/__OWNER__/jjam-picturebook/actions
   - 모아보기는 이 저장소 Actions → `모아보기 검증·발행` → Run workflow
2. 몇 분 뒤 이 저장소 Actions → `발행 확인` → Run workflow. 아홉 곳이 모두 맞으면 이 이슈가 저절로 닫힙니다.
3. 그래도 안 맞으면 원인을 봅니다.
   - 신호가 실패했다(HTTP 401) → `PUBLISH_TOKEN` 만료. 토큰을 갱신합니다(`발행 토큰 만료 확인` 이슈 참고).
   - 그 저장소의 발행 워크플로가 실패했다 → 그 실행 기록을 엽니다.
   - 발행 워크플로가 꺼져 있다(60일 활동 없음) → `발행 저장소 깨워 두기` 가 실패했는지 봅니다.
   - `?` 가 오래 간다 → 그 주소를 브라우저로 열어 봅니다. Pages 설정(Source = GitHub Actions)이 바뀌었을 수 있습니다.
