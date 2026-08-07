만료되면 `발행 신호 보내기` 가 실패해서 **머지해도 즉시 발행되지 않습니다.**
다만 **사이트가 죽지는 않습니다** — 각 발행 저장소의 하루 한 번 크론(KST 새벽
4시대)이 안전망으로 남아, 반영이 최대 하루 늦어질 뿐입니다.

## 새로 발급하는 법

1. GitHub → Settings → Developer settings → **Personal access tokens (fine-grained)**
2. Resource owner: `__OWNER__`
3. Repository access: **Only select repositories** →
   `jjam` · `jjam-quiz` · `jjam-video` · `jjam-story` · `jjam-word`
   (`jjam-classroom` 은 넣지 않습니다 — 여기서 나가 저기를 두드리는 용도입니다)
4. Repository permissions → **Contents: Read and write** (나머지는 No access)
5. Generate token → 문자열 복사
6. 이 저장소 → Settings → Secrets and variables → Actions →
   `PUBLISH_TOKEN` → **Update secret** 에 붙여넣기

다 하셨으면 Actions 탭에서 `발행 토큰 만료 확인` 을 한 번 돌려 보세요.
여유가 확인되면 이 이슈는 **자동으로 닫힙니다.**

<sub>이 이슈는 `.github/workflows/token-expiry.yml` 이 매주 월요일에 확인해
갱신합니다. 본문 틀은 `.github/token-expiry-issue.md` 에 있습니다.</sub>
