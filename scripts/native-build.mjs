#!/usr/bin/env node
/**
 * Native build wrapper.
 *
 * `output: "export"` cannot emit route handlers, and `src/app/api/health` is
 * explicitly `force-dynamic` because a liveness probe with a cached timestamp
 * is worthless. Rather than weaken the web deployment's health check to satisfy
 * the native build, this script moves the API directory aside for the duration
 * of the export and always puts it back.
 *
 * The move is idempotent and self-healing: if a previous run was interrupted,
 * the stashed directory is restored before anything else happens.
 */
import { execFileSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "src/app/api");
// Stash outside src/app. A dot- or underscore-prefixed folder inside the app
// directory is still compiled by Turbopack, so moving it out is the only
// reliable exclusion.
const stashDir = join(root, ".native-build-stash-api");
const outDir = join(root, "out");

function restore() {
  if (existsSync(stashDir)) {
    if (existsSync(apiDir)) {
      // Both present means a partial restore. The stash is the original.
      rmSync(apiDir, { recursive: true, force: true });
    }
    renameSync(stashDir, apiDir);
  }
}

// Recover from an interrupted previous run before doing anything else.
restore();

let failed = false;
try {
  if (existsSync(apiDir)) {
    renameSync(apiDir, stashDir);
    console.log("• excluded src/app/api from the native export");
  }

  rmSync(outDir, { recursive: true, force: true });

  execFileSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "native" },
  });
} catch (error) {
  failed = true;
  console.error(`\nNative build failed: ${error.message}`);
} finally {
  restore();
  console.log("• restored src/app/api");
}

if (failed) process.exit(1);

if (!existsSync(join(outDir, "index.html"))) {
  console.error("\nExport finished but out/index.html is missing.");
  process.exit(1);
}

console.log(`\nStatic bundle ready in out/. Run "npm run native:sync" to copy it into the native projects.`);
