import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ─────────────────────────────────────────────────────────
// NOTE: CSP is intentionally NOT set here.
// It is generated per-request in middleware.ts with a fresh
// nonce so that 'unsafe-inline' is never needed for scripts.
//
// Static headers here cover everything that doesn't need
// per-request values.
// ─────────────────────────────────────────────────────────

const staticSecurityHeaders = [
  // Clickjacking — belt-and-suspenders alongside CSP frame-ancestors
  { key: "X-Frame-Options", value: "DENY" },

  // MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // HSTS — 2 years, include subdomains, submit to preload list
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Referrer — don't leak full URL cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Permissions — deny all hardware APIs we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },

  // Cross-origin isolation helpers (enable if you need SharedArrayBuffer)
  // { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },

  // Prevent browsers from sending DNS prefetch requests for external domains
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Remove X-Powered-By: Next.js fingerprint
  poweredByHeader: false,

  // Disable source maps in production — prevents source code
  // from being readable in browser DevTools
  productionBrowserSourceMaps: false,

  compiler: {
    // Strip all console.log/debug in production; keep error + warn
    removeConsole: !isDev ? { exclude: ["error", "warn"] } : false,
  },

  async headers() {
    return [
      // ── Static security headers on every route ──────────────
      // CSP is excluded here — it's set dynamically in middleware.ts
      {
        source: "/(.*)",
        headers: staticSecurityHeaders,
      },

      // ── Never cache API proxy responses ──────────────────────
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          // Prevent API responses from being framed
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },

      // ── Public folder assets ─────────────────────────────────
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|svg|ico|woff2|woff|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
