import type { MetadataRoute } from "next";

/**
 * Installable as a mobile web app. Standalone display and a dark theme colour
 * keep the shell feeling native on a phone home screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PreSeed — male fertility intelligence",
    short_name: "PreSeed",
    description:
      "A research prototype that turns clinical results and lifestyle data into a measured profile, a transparent readiness score and a dated, evidence-cited protocol.",
    start_url: "/today",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1113",
    theme_color: "#0b1113",
    categories: ["health", "medical"],
  };
}
