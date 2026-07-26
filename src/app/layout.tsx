import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * The bible (docs/design/DESIGN.md) speaks one typeface: Sequel Sans,
 * substituted with Manrope — a variable geometric grotesque, so the bible's
 * 400/450/500 weights all resolve. The legacy sans/serif/mono registers all
 * alias to it in globals.css; no other font ships.
 */
const jetonSans = Manrope({
  subsets: ["latin"],
  variable: "--jt-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PreSeed — male fertility intelligence",
  description:
    "Turns semen analyses, hormone results and lifestyle data into a measured profile, a transparent readiness score and a dated, evidence-cited protocol.",
  applicationName: "PreSeed",
  appleWebApp: { capable: true, title: "PreSeed", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full ${jetonSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
