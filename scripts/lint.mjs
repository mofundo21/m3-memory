import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbidden = [
  "ecosystem-hub",
  "M3-HUB-MVP1",
  "m3-hub-mvp",
  "M3 Hub"
];
const roots = ["src", "docs/setup", "supabase", "scripts"];
const allowed = new Set([
  "docs/HANDOFF.md",
  "scripts/lint.mjs"
]);
const textExt = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".sql", ".json", ".css"]);
const violations = [];

function ext(path) {
  const i = path.lastIndexOf(".");
  return i === -1 ? "" : path.slice(i);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name).replace(/\\/g, "/");
    if (path.includes("node_modules") || path.includes("tools/vendor") || path.includes("graphify-out")) continue;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!textExt.has(ext(path)) || allowed.has(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const term of forbidden) {
      if (content.includes(term)) violations.push(`${path}: forbidden old-project reference: ${term}`);
    }
  }
}

for (const root of roots) walk(root);

if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("lint ok: no forbidden old-project references in app/docs/scripts");

