import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Dev only: let phones on the local network load the dev server's scripts when testing
  // with `npm run dev -- -H 0.0.0.0` and http://<lan-ip>:3000. Without this, Next.js blocks
  // the JavaScript and the page renders but nothing responds to taps.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
