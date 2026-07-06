---
name: blog-post
description: 키워드를 받아 채권추심(서진원) 블로그 글을 쓰고 발행(또는 PR 초안 생성)하는 자동화. "블로그 글 써줘", "이 키워드로 포스팅해줘", 매일 초안 트리거에서 사용.
---

# 블로그 글 자동화 (seojinwon.com)

키워드 하나로 채권추심 실무 블로그 글 한 편을 작성해 발행하거나 승인용 PR을 만든다.

## 필수 참고 문서 (글 쓰기 전에 반드시 읽기)
- `docs/writing-guide.md` — 문체·구조·SEO·금지선. **모든 규칙은 이 문서가 기준.**
- `docs/content-calendar.md` — 주제 목록. 키워드가 지정되지 않았으면 여기서 미발행(☐) 주제 중 최상단 선택.

## 절차

1. **주제 확정**: 사용자가 키워드를 줬으면 그것을, 아니면 content-calendar.md의 미발행 주제 중 가장 위를 선택. `_posts/`를 확인해 중복 주제가 없는지 검증.
2. **글 작성**: writing-guide.md 구조대로 제목·description·본문(마크다운) 작성. 내부 링크(`/process/` + 기존 글) 포함.
3. **파일 생성**: 본문을 임시 파일로 저장 후 실행:
   ```
   node scripts/create-post.js --keyword "<키워드>" --title "<제목>" --slug "<영문-slug>" \
     --category "<카테고리>" --description "<메타 설명>" --body-file <임시파일>
   ```
4. **캘린더 갱신**: content-calendar.md에서 해당 주제를 ☑ + 발행일로 갱신. (목록에 없던 키워드면 ☑ 상태로 행 추가)
5. **발행 방식 분기**:
   - **대화 중 사용자가 직접 요청한 경우**: 사용자 확인 후 main 반영(또는 요청대로).
   - **매일 초안 트리거에서 실행된 경우 (기본)**: 절대 main에 직접 push하지 않는다.
     1. `draft/YYYY-MM-DD-slug` 브랜치 생성 → 커밋 → push
     2. main 대상 PR 생성. PR 본문에: 글 전문 미리보기, 타깃 키워드, 체크리스트(사실관계 확인 / 금지선 준수 / 오탈자)
     3. **PR을 merge하지 않고 종료.** merge는 사장님(사용자)의 승인 행위다.
6. **네이버 블로그 (선택)**: 사용자가 원할 때만 `scripts/publish-naver.js` 안내 (로컬 전용, 원격 환경에서 실행 금지 — scripts/README.md 참고).

## 참고 파일
- `scripts/create-post.js`: 포스트 파일 생성기
- `_layouts/post.html`: 면책·저자 박스·CTA가 자동으로 붙으므로 본문에 중복 작성 금지
- `scripts/README.md`: 네이버 발행 스크립트 한계 고지
