---
name: blog-post
description: 키워드를 받아 채권추심(서진원) 블로그 글을 쓰고, 이 저장소(Jekyll/GitHub Pages)에 발행하고, 원하면 네이버 블로그에도 올리는 자동화. "블로그 글 써줘", "이 키워드로 포스팅해줘" 같은 요청에 사용.
---

# 블로그 글 자동화 (choosim)

키워드 하나를 입력받아 채권추심 실무 블로그 글 한 편을 작성하고 발행까지 진행한다.

## 절차

1. **키워드 확인**: 사용자가 준 키워드(예: "가압류 신청 방법")를 확인한다. 없으면 물어본다.
2. **글 작성**: 서진원(18년 경력 채권추심 실무가) 톤으로, `_posts/2026-07-03-first-post.md`의 문체를 참고해 제목과 본문(마크다운)을 직접 작성한다.
   - 소제목(`##`), 굵은 글씨(`**`) 등을 적절히 사용한다.
   - 과장·확정적 법률 자문처럼 보이는 표현은 피하고, 실무 정보 제공 톤을 유지한다.
   - 이미지는 아직 다루지 않는다 (첨부 없이 텍스트만).
3. **슬러그 결정**: 제목을 영문 ascii-slug로 변환한다 (예: "가압류 신청 방법" → `provisional-seizure-guide`).
4. **본문을 임시 파일로 저장** 후 `scripts/create-post.js` 실행:
   ```
   node scripts/create-post.js --keyword "<키워드>" --title "<제목>" --slug "<slug>" --body-file <임시파일경로>
   ```
   이 스크립트가 `_posts/YYYY-MM-DD-slug.md`(Jekyll 발행용)와 `scripts/.output/YYYY-MM-DD-slug.txt`(네이버 발행용 평문)를 생성한다.
5. **Jekyll 발행**: 사용자에게 확인 후 `git add`, `commit`, `push`. GitHub Pages가 자동 배포한다.
6. **네이버 블로그 발행 (선택)**: 사용자가 원하면 `scripts/publish-naver.js` 사용법을 안내한다.
   - 이 스크립트는 실제 네이버 로그인이 필요하고, 이 환경(원격 샌드박스)에서는 자격증명이 없어 실행/검증이 불가능하다.
   - 사용자에게: "로컬 PC에서 `.env`에 NAVER_ID/PW/BLOG_ID를 채우고 `npm install && npx playwright install chromium` 후 `node scripts/publish-naver.js --text-file scripts/.output/<파일>.txt`로 직접 실행/검증해달라"고 안내한다.
   - 절대 이 스크립트를 원격 환경에서 실제 네이버 자격증명과 함께 실행하려 하지 않는다.

## 참고 파일
- `scripts/create-post.js`: 포스트 생성 스크립트
- `scripts/publish-naver.js`: 네이버 발행 best-effort 스크립트 (로컬 전용)
- `scripts/README.md`: 두 스크립트의 상세 사용법과 한계
