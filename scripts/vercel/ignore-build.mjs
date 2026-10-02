const ref = String(process.env.VERCEL_GIT_COMMIT_REF || "").trim();
const message = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || "");

const isMain = ref === "main" || ref === "refs/heads/main";
const isExplicitPreview = message.includes("[vercel]");

if (!ref) {
  console.log("BUILD: VERCEL_GIT_COMMIT_REF is missing; fail-safe to build.");
  process.exit(1);
}

if (isMain) {
  console.log("BUILD: main always deploys.");
  process.exit(1);
}

if (isExplicitPreview) {
  console.log("BUILD: explicit [vercel] preview checkpoint.");
  process.exit(1);
}

console.log(`SKIP: routine non-main commit on ${ref}.`);
process.exit(0);
