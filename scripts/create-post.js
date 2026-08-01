#!/usr/bin/env node
// 키워드/제목/본문을 받아 Jekyll 포스트(_posts/*.md)를 생성하고,
// 네이버 블로그 발행용 평문 텍스트(scripts/.output/*.txt)도 함께 만든다.
//
// 사용법:
//   node scripts/create-post.js --keyword "가압류 신청" --title "가압류 신청 방법" \
//     --slug "provisional-seizure" --body-file /path/to/body.md \
//     --category "법적절차" --description "메타 설명 (80~110자 권장)"

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function stripMarkdown(md) {
  return md
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { keyword, title, slug, category, description, "body-file": bodyFile, date } = args;

  if (!title || !slug || !bodyFile) {
    console.error(
      "필수 인자 누락: --title, --slug, --body-file 는 반드시 필요합니다. (--keyword 는 선택)"
    );
    process.exit(1);
  }
  if (!fs.existsSync(bodyFile)) {
    console.error(`본문 파일을 찾을 수 없습니다: ${bodyFile}`);
    process.exit(1);
  }

  const body = fs.readFileSync(bodyFile, "utf8").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.error("slug는 영문 소문자·숫자와 단일 하이픈만 사용할 수 있습니다.");
    process.exit(1);
  }

  const allowedCategories = new Set([
    "개인채권",
    "사업자미수금",
    "법적절차",
    "실무노하우",
    "비용안내",
    "신뢰·법규",
    "재산·소재조사",
  ]);
  if (category && !allowedCategories.has(category)) {
    console.error(`허용되지 않은 카테고리입니다: ${category}`);
    process.exit(1);
  }

  const postDate = date || todayInSeoul();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(postDate)) {
    console.error("date는 YYYY-MM-DD 형식이어야 합니다.");
    process.exit(1);
  }

  const frontMatterLines = ["---", "layout: post", `title: "${title.replace(/"/g, '\\"')}"`];
  if (keyword) {
    frontMatterLines.push(`keyword: "${keyword.replace(/"/g, '\\"')}"`);
  }
  if (category) {
    frontMatterLines.push(`category: ${category}`);
  }
  if (description) {
    frontMatterLines.push(`description: "${description.replace(/"/g, '\\"')}"`);
  }
  frontMatterLines.push("---", "");

  const postContent = `${frontMatterLines.join("\n")}\n${body}\n`;
  const postsDir = path.join(repoRoot, "_posts");
  const postPath = path.join(postsDir, `${postDate}-${slug}.md`);

  if (fs.existsSync(postPath)) {
    console.error(`이미 같은 파일이 존재합니다: ${postPath}`);
    process.exit(1);
  }

  fs.mkdirSync(postsDir, { recursive: true });
  fs.writeFileSync(postPath, postContent, "utf8");

  const outputDir = path.join(repoRoot, "scripts", ".output");
  fs.mkdirSync(outputDir, { recursive: true });
  const plainTextPath = path.join(outputDir, `${postDate}-${slug}.txt`);
  fs.writeFileSync(plainTextPath, `${title}\n\n${stripMarkdown(body)}\n`, "utf8");

  console.log(`Jekyll 포스트 생성: ${path.relative(repoRoot, postPath)}`);
  console.log(`네이버 발행용 평문 생성: ${path.relative(repoRoot, plainTextPath)}`);
}

main();
