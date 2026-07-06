#!/usr/bin/env node
// 네이버 블로그에 실제로 글을 발행하는 best-effort 스크립트.
//
// ⚠️ 중요 - 실행 전에 반드시 읽어주세요 ⚠️
// - 네이버는 블로그 글쓰기용 공개 API를 더 이상 제공하지 않습니다. 이 스크립트는
//   Playwright로 실제 브라우저를 띄워 로그인 후 에디터를 조작하는 방식입니다.
// - 네이버는 자동화된 로그인을 탐지해 캡차/2차 인증/새 기기 알림을 띄울 수 있습니다.
//   이 스크립트는 그런 탐지를 "우회"하지 않습니다 — headful(화면 보이는) 브라우저로 열리며,
//   로그인 중 캡차/2차 인증이 뜨면 스크립트가 잠시 대기하니 사람이 직접 완료해야 합니다.
// - 이 저장소를 실행하는 원격 샌드박스 환경에는 실제 네이버 계정이 없어 이 스크립트를
//   끝까지 테스트/검증하지 못했습니다. 로컬 PC에서 본인 계정으로 먼저 검증하세요.
// - 네이버 에디터(SmartEditor ONE)의 DOM 구조는 자주 바뀝니다. 아래 셀렉터가 깨지면
//   `--debug` 옵션으로 브라우저를 느리게 띄워 직접 눈으로 확인 후 셀렉터를 고쳐주세요.
//
// 사용법:
//   cp .env.example .env  # NAVER_ID, NAVER_PW, NAVER_BLOG_ID 채우기
//   npm install
//   npx playwright install chromium
//   node scripts/publish-naver.js --text-file scripts/.output/2026-07-06-slug.txt [--debug]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sessionDir = path.join(repoRoot, "scripts", ".naver-session");

function parseArgs(argv) {
  const args = { debug: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--debug") {
      args.debug = true;
    } else if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function ensureLoggedIn(page) {
  await page.goto("https://www.naver.com");
  const alreadyLoggedIn = await page
    .locator("a.MyView-module__link_login___HpHMW")
    .count()
    .then((c) => c === 0)
    .catch(() => false);
  if (alreadyLoggedIn) return;

  await page.goto("https://nid.naver.com/nidlogin.login");
  await page.fill("#id", process.env.NAVER_ID ?? "");
  await page.fill("#pw", process.env.NAVER_PW ?? "");
  await page.click("#log\\.login");

  // 캡차/2차 인증 등 사람이 직접 처리해야 하는 화면이 뜰 수 있으므로
  // 로그인 도메인을 벗어날 때까지 최대 2분간 폴링하며 기다린다.
  const deadline = Date.now() + 2 * 60 * 1000;
  while (Date.now() < deadline) {
    if (!page.url().includes("nid.naver.com")) return;
    console.log("로그인 진행 대기 중... 캡차/2차 인증이 보이면 브라우저에서 직접 완료해주세요.");
    await page.waitForTimeout(3000);
  }
  throw new Error("로그인이 2분 내에 완료되지 않았습니다. 브라우저에서 수동으로 로그인 후 다시 시도해주세요.");
}

async function publishPost(page, blogId, title, paragraphs) {
  await page.goto(
    `https://blog.naver.com/${blogId}?Redirect=Write&redirect=Write&widgetTypeCall=true`
  );

  const frame = page.frameLocator("#mainFrame");

  // 이전 작성 중이던 글이 있으면 뜨는 "이어쓰기" 팝업 닫기
  const cancelDialogBtn = frame.getByRole("button", { name: "취소" });
  if (await cancelDialogBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cancelDialogBtn.click();
  }

  await frame.locator(".se-title-text").click();
  await page.keyboard.type(title, { delay: 30 });

  await frame.locator(".se-text-paragraph").last().click();
  for (const paragraph of paragraphs) {
    await page.keyboard.type(paragraph, { delay: 10 });
    await page.keyboard.press("Enter");
  }

  await frame.getByRole("button", { name: "발행", exact: true }).click();
  // 발행 옵션 다이얼로그의 최종 발행 버튼
  await frame.getByRole("button", { name: "발행", exact: true }).last().click();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { "text-file": textFile, debug } = args;
  const blogId = process.env.NAVER_BLOG_ID;

  if (!textFile || !blogId) {
    console.error(
      "필수 값 누락: --text-file 인자와 .env의 NAVER_BLOG_ID 가 필요합니다."
    );
    process.exit(1);
  }
  if (!fs.existsSync(textFile)) {
    console.error(`텍스트 파일을 찾을 수 없습니다: ${textFile}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(textFile, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const [title, ...paragraphs] = lines;

  fs.mkdirSync(sessionDir, { recursive: true });
  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: false,
    slowMo: debug ? 250 : 0,
  });
  const page = context.pages()[0] ?? (await context.newPage());

  try {
    await ensureLoggedIn(page);
    await publishPost(page, blogId, title, paragraphs);
    console.log("네이버 블로그 발행 요청을 보냈습니다. 브라우저에서 결과를 확인해주세요.");
  } finally {
    if (!debug) {
      await context.close();
    } else {
      console.log("--debug 모드: 브라우저를 열어둔 채로 종료합니다. 직접 닫아주세요.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
