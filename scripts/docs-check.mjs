import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
const root = process.cwd(), errors = [], manifestPath = join(root, "docs/knowledge-base/manifest.json");
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.readInOrder)) errors.push("invalid knowledge manifest");
  for (const file of manifest.readInOrder ?? []) if (!existsSync(join(dirname(manifestPath), file))) errors.push(`missing manifest entry: ${file}`);
} catch (error) { errors.push(`cannot read manifest: ${error.message}`); }
for (const file of readdirSync(join(root, "docs/project/adr")).filter((name) => /^\d{4}-.+\.md$/.test(name))) {
  const text = readFileSync(join(root, "docs/project/adr", file), "utf8");
  for (const heading of ["## Context", "## Decision", "## Consequences"]) if (!text.includes(heading)) errors.push(`${file} missing ${heading}`);
  if (!/- Status: (Proposed|Accepted|Deprecated|Superseded)/.test(text)) errors.push(`${file} invalid status`);
}
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]); }
for (const file of walk(join(root, "docs")).filter((name) => name.endsWith(".md"))) {
  for (const match of readFileSync(file, "utf8").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (target && !/^https?:/.test(target) && !existsSync(resolve(dirname(file), target))) errors.push(`${file}: broken link ${target}`);
  }
}
const openapi = readFileSync(join(root, "docs/project/contracts/http/openapi.yaml"), "utf8");
for (const key of ["openapi:", "info:", "paths:"]) if (!openapi.includes(key)) errors.push(`OpenAPI missing ${key}`);
if (errors.length) { console.error(`Documentation check failed:\n- ${errors.join("\n- ")}`); process.exit(1); }
console.log("Documentation contracts look consistent.");
