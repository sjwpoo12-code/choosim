# 블로그 자동화 스크립트

키워드로 글을 써서 이 저장소(Jekyll/GitHub Pages)와 네이버 블로그에 발행하기 위한 스크립트 모음.
사람이 매번 실행할 때 키워드를 넘겨주는 방식이며, 글감을 자동으로 크롤링하지는 않는다.
`/blog-post` Claude Code 스킬(`.claude/skills/blog-post/SKILL.md`)이 이 스크립트들을 순서대로 호출한다.

## 1. Jekyll 포스트 생성 — `create-post.js`

이 저장소에 바로 발행 가능한 마크다운 포스트를 만든다. 완전히 자동화 가능하고 이 환경에서도 테스트됨.

```bash
node scripts/create-post.js \
  --keyword "가압류 신청 방법" \
  --title "가압류, 언제 어떻게 신청해야 할까요?" \
  --slug "provisional-seizure-guide" \
  --body-file /path/to/body.md
```

- `_posts/YYYY-MM-DD-<slug>.md` 생성 (Jekyll front matter 포함)
- `scripts/.output/YYYY-MM-DD-<slug>.txt` 생성 (마크다운 기호를 제거한 평문 — 네이버 발행용)
- 생성 후에는 평소처럼 `git add`, `git commit`, `git push` 하면 GitHub Pages가 자동 배포한다.
- 이미지/첨부자료는 아직 다루지 않는다. 나중에 추가하려면 front matter에 `image:` 필드를 넣고 본문에 마크다운 이미지 문법(`![](url)`)을 쓰면 된다.

## 2. 네이버 블로그 발행 — `publish-naver.js` (⚠️ best-effort, 로컬 전용)

**이 스크립트는 이 원격 샌드박스 환경에서 실행/검증되지 않았습니다.** 이유:

- 네이버는 블로그 글쓰기용 공개 API를 더 이상 제공하지 않아, 실제 로그인 후 에디터(SmartEditor ONE)를
  브라우저 자동화(Playwright)로 조작하는 방법뿐이다.
- 로그인 시 캡차/2차 인증/새 기기 알림이 뜰 수 있고, 이는 사람이 직접 처리해야 한다 (이 스크립트는
  그런 보안 절차를 우회하지 않는다).
- 이 환경에는 실제 네이버 계정 자격증명이 없어 로그인부터 발행까지 끝까지 실행해볼 수 없었다.
- 네이버 에디터 DOM 구조는 자주 바뀐다. 셀렉터가 깨지면 `--debug`로 느리게 띄워 직접 확인 후 고쳐야 한다.

### 사용법 (본인 PC에서)

```bash
cp .env.example .env         # NAVER_ID, NAVER_PW, NAVER_BLOG_ID 채우기
npm install
npx playwright install chromium

node scripts/publish-naver.js --text-file scripts/.output/2026-07-06-provisional-seizure-guide.txt
```

- 처음 실행 시 캡차/2차 인증이 뜨면 브라우저 창에서 직접 완료해야 한다 (최대 2분 대기).
- 로그인 세션은 `scripts/.naver-session/`에 저장되어 다음 실행부터는 재로그인이 필요 없을 수 있다 (git에는 커밋되지 않음).
- 문제가 있으면 `--debug` 옵션으로 브라우저를 느리게 띄워 단계별로 확인하며 셀렉터를 수정한다.

### 자격증명 관리

- `.env`는 `.gitignore`에 포함되어 있어 커밋되지 않는다. 실수로도 커밋하지 말 것.
