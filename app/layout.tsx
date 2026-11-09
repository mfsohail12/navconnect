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

// Portrait iPhone screens as [CSS width, CSS height, pixel ratio].
const SPLASH_SIZES = [
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12 Pro Max, 13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 12 Pro, 13, 13 Pro, 14
  [375, 812, 3], // X, XS, 11 Pro, 12 mini, 13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [414, 736, 3], // 6 Plus to 8 Plus
  [375, 667, 2], // 6 to 8, SE (2nd and 3rd gen)
] as const;

export const metadata: Metadata = {
  title: "NavConnect",
  description: "NavConnect: accessible AR hospital wayfinding prototype.",
  // Home-screen app on iOS. The status bar overlays the page; the patient app pads
  // its screens with env(safe-area-inset-*) so nothing sits under it.
  appleWebApp: {
    capable: true,
    title: "NavConnect",
    statusBarStyle: "black-translucent",
    // Launch screen while the home-screen app starts: the logo on the app background.
    // iOS only uses an image whose media query matches the exact device size and pixel
    // ratio, and shows a blank screen otherwise. Files are in public/splash/.
    startupImage: SPLASH_SIZES.map(([w, h, ratio]) => ({
      url: `/splash/iphone-${w * ratio}x${h * ratio}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
    })),
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
