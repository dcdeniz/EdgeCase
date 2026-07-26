import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Manrope, Newsreader } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * The bible (docs/design/DESIGN.md) speaks one typeface: Sequel Sans,
 * substituted here with Manrope — a variable geometric grotesque, so the
 * bible's 400/450/500 weights all resolve. Redesigned surfaces use it via
 * `font-sequel-sans`; the three legacy registers below remain loaded for
 * screens not yet migrated.
 */
const jetonSans = Manrope({
  subsets: ["latin"],
  variable: "--jt-sans",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ps-font-sans",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--ps-font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ps-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PreSeed — male fertility intelligence",
  description:
    "A research prototype that turns semen analyses, hormone results and lifestyle data into a measured profile, a transparent readiness score and a dated, evidence-cited protocol.",
  applicationName: "PreSeed",
  appleWebApp: { capable: true, title: "PreSeed", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1113" },
    { media: "(prefers-color-scheme: light)", color: "#f2f5f4" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full ${jetonSans.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
