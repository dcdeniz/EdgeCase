import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "ml/.venv/**",
    "ml/**/__pycache__/**",
    "next-env.d.ts",
    // Capacitor native projects. These hold generated platform scaffolding and
    // a copy of the built web bundle, neither of which is source.
    "ios/**",
    "android/**",
  ]),
]);

export default eslintConfig;
