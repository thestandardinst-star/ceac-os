import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const base = process.env.VERIFICATION_BASE_SHA || "HEAD^";
const head = process.env.VERIFICATION_HEAD_SHA || "HEAD";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

let changed = "";
try {
  changed = git("diff", "--name-only", `${base}...${head}`);
} catch {
  changed = git("diff", "--name-only", base, head);
}

const markdownFiles = changed
  .split("\n")
  .filter((file) => file && (file.endsWith(".md") || file === "AGENTS.md"));
const required = [
  "AGENTS.md",
  "docs/experience-v2/BUILD_STATE.md",
  "docs/experience-v2/VERIFICATION_PROTOCOL.md",
];
const files = [...new Set([...required, ...markdownFiles])];
const problems = [];

for (const file of files) {
  if (!existsSync(file)) {
    problems.push(`${file}: file is missing`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  if (/^(<{7}|={7}|>{7})/m.test(source)) {
    problems.push(`${file}: unresolved merge-conflict marker`);
  }
  if (source.includes("\0")) problems.push(`${file}: contains a NUL byte`);

  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, "").split(/\s+["']/)[0];
    if (!raw || raw.startsWith("#") || /^[a-z]+:/i.test(raw)) continue;
    const local = decodeURIComponent(raw.split("#")[0]);
    if (local && !existsSync(resolve(dirname(file), local))) {
      problems.push(`${file}: broken local link ${raw}`);
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`Documentation integrity passed for ${files.length} file(s).`);
