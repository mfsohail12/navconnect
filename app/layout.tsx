import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, JetBrains_Mono, Lexend, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// The prototype's fonts, exposed as CSS variables used by --f-body, --f-display and --f-mono.
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
});
const lexend = Lexend({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-lexend",
});
const jetbrains = JetBrains_Mono({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
const notoArabic = Noto_Sans_Arabic({
  weight: ["400", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  // Only needed when someone switches to Arabic.
  preload: false,
});

export const metadata: Metadata = {
  title: "NavConnect",
  description: "NavConnect: accessible AR hospital wayfinding prototype.",
  // Home-screen app on iOS. The status bar overlays the page; the patient app pads
  // its screens with env(safe-area-inset-*) so nothing sits under it.
  appleWebApp: {
    capable: true,
    title: "NavConnect",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1546C8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${atkinson.variable} ${lexend.variable} ${jetbrains.variable} ${notoArabic.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
