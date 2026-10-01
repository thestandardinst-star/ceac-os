import fs from "node:fs";

const requiredFiles = [
  "docs/visual-fidelity/START_HERE.md",
  "docs/visual-fidelity/BUILD_STATE.md",
  "docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md",
  "docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md",
  "docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md",
  "docs/visual-fidelity/REFERENCE_MANIFEST.md",
  "docs/visual-fidelity/SESSION_START_PROMPT.md",
  "docs/visual-fidelity/VF_ACCEPTANCE_RECORD_TEMPLATE.md",
  "docs/visual-fidelity/targets/CEAC_PREMIUM_COMPOSITION_TARGET.html",
  "docs/visual-fidelity/references/README.md",
];

const failures = [];

for (const path of requiredFiles) {
  if (!fs.existsSync(path)) failures.push(`missing required visual-fidelity source: ${path}`);
}

const mustContain = {
  "AGENTS.md": [
    "docs/visual-fidelity/START_HERE.md",
    "Level C",
  ],
  "CLAUDE.md": [
    "docs/visual-fidelity/START_HERE.md",
    "Level C",
  ],
  "docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md": [
    "Level C",
    "generic enterprise dashboard",
    "TECHNICALLY ACCEPTED",
    "VISUALLY / PRODUCT-EXPERIENCE ACCEPTED",
  ],
  "docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md": [
    "VF0",
    "VF1",
    "VF2",
    "VF3",
    "VF4",
    "VF5",
    "VF6",
    "VF7",
    "VF8",
    "VF9",
    "VF10",
  ],
  "docs/visual-fidelity/SESSION_START_PROMPT.md": [
    "GITHUB IS CANONICAL",
    "ONE ACTIVE WRITER ONLY",
    "LEVEL C IS MANDATORY",
    "VF10E",
  ],
  "docs/visual-fidelity/REFERENCE_MANIFEST.md": [
    "87a67c5b2902e6c0b62e7d55570ec644483aa501c0584bff5c7fae70d41917cc",
    "dcb56f1d315a06d669c03dd251c247b127d88004392de101da8a465272a900cc",
    "4cbc4c7aeb467a7ba889edec3464fbc0e7a1a72f75f32ada7360bb61aeb3b562",
    "8eeffe84b8a3e08616c37c8764cb65a271796152d06c0f89a528b8045dbbfddd",
    "0ec1c21124f7dd4e4f3143d8a1394de7a4599b870c85afc4578d7af643598b91",
    "CEAC_PREMIUM_COMPOSITION_TARGET.html",
  ],
  "docs/visual-fidelity/targets/CEAC_PREMIUM_COMPOSITION_TARGET.html": [
    "People. Work. Ministry. Impact.",
    "Needs your attention",
    "Waiting on others",
    "Coming up",
    "Calendar context",
  ],
};

for (const [path, markers] of Object.entries(mustContain)) {
  if (!fs.existsSync(path)) {
    failures.push(`cannot inspect missing file: ${path}`);
    continue;
  }
  const text = fs.readFileSync(path, "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${path} lost binding marker: ${marker}`);
  }
}

if (failures.length) {
  console.error("Visual fidelity contract check FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Visual fidelity contract check passed.");
