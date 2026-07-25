import { watch } from "node:fs";
import { spawn } from "node:child_process";
let timer;
const check = (_event, filename = "") => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    spawn(process.execPath, ["scripts/docs-check.mjs"], { stdio: "inherit" });
    if (String(filename).includes("functions/api")) spawn("npm", ["run", "edge:check"], { stdio: "inherit" });
  }, 120);
};
for (const path of ["docs", "supabase", "src", ".env.example"]) watch(path, { recursive: true }, check);
console.log("Watching documentation-impacting files. Press Ctrl+C to stop."); check();
