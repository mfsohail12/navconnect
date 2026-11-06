import type { MetadataRoute } from "next";

// Installable PWA (no service worker, no offline caching; out of scope for the demo).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NavConnect",
    short_name: "NavConnect",
    description: "Accessible hospital wayfinding concept for Lakeridge Health Oshawa.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#1546C8",
    background_color: "#ebf0f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
