import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor loads the static export from `out/` out of the app bundle. There is
 * no Next.js server on device — see next.config.ts for how that build target is
 * produced, and scripts/native-build.mjs for why the API directory is excluded.
 *
 * The Supabase Edge API is still reached over HTTPS exactly as it is from the
 * browser, so nothing about the backend contract changes.
 */
const config: CapacitorConfig = {
  appId: "is.neat.preseed",
  appName: "PreSeed",
  webDir: "out",

  // The shell is dark by default, so the native background behind the WebView
  // matches --ps-ground. Without this a light flash appears during launch and
  // when the keyboard animates.
  backgroundColor: "#0b1113",

  ios: {
    // The design already sets viewport-fit=cover and uses env(safe-area-inset-*)
    // for the header and bottom navigation, so the WebView must not add its own
    // insets on top.
    contentInset: "never",
    backgroundColor: "#0b1113",
    // Links to evidence sources should leave the app rather than trapping the
    // user in a WebView with no browser chrome.
    limitsNavigationsToAppBoundDomains: true,
  },

  android: {
    backgroundColor: "#0b1113",
    // Keep the bundled scheme on https so that Web Crypto, storage partitioning
    // and Supabase auth behave the same as on the web deployment.
    webContentsDebuggingEnabled: false,
  },

  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
  },
};

export default config;
