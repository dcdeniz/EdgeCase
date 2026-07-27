import type { NextConfig } from "next";

/**
 * Two build targets from one codebase.
 *
 * Default — the Vercel web deployment. Server rendering, route handlers and
 * image optimisation all behave normally. Nothing about this path changes.
 *
 * `BUILD_TARGET=native` — a fully static bundle for Capacitor to load from the
 * device. Capacitor serves files from the app bundle over a local scheme, so
 * there is no Next.js server: every route must be prerendered, images cannot be
 * optimised on demand, and route handlers cannot exist.
 *
 * Run the native build through `npm run native:build`, never `next build`
 * directly — the wrapper also excludes `src/app/api`, which cannot be
 * statically exported. See scripts/native-build.mjs.
 */
const isNativeTarget = process.env.BUILD_TARGET === "native";

// Pin the workspace root. Without it, a git worktree checkout resolves to the
// parent repository's lockfile and Turbopack warns about an ambiguous root.
const turbopack = { root: import.meta.dirname };

const nextConfig: NextConfig = isNativeTarget
  ? {
      turbopack,
      output: "export",
      // Capacitor's local server has no rewrite layer, so directory-style URLs
      // need a real index.html at each path.
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : { turbopack };

export default nextConfig;
