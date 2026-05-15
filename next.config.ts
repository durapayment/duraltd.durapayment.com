import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ─── Security Headers ────────────────────────────────────────────────────────
const securityHeaders = [
  // Fixes: Missing Anti-clickjacking Header
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Fixes: X-Content-Type-Options Header Missing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Fixes: Strict-Transport-Security
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Good practice
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Restrict browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Fixes: Re-examine Cache-control Directives (for HTML pages)
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, proxy-revalidate",
  },
  // Fixes: Content Security Policy (CSP) Header Not Set
  // Fixes: Missing Anti-clickjacking Header (frame-ancestors)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline and unsafe-eval in dev
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'", // tighten further with nonces later
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      // Add your Laravel API domain here:
      "connect-src 'self' https://api.durapayment.com https://online.durapayment.com wss://online.durapayment.com",
      "frame-src 'none'",
      "frame-ancestors 'none'", // stronger than X-Frame-Options
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Fixes: Server Leaks Information via X-Powered-By
  poweredByHeader: false,

  // Strip console logs and comments in production
  // Helps with: Information Disclosure - Suspicious Comments
  compiler: {
    removeConsole: !isDev,
  },

  async headers() {
    return [
      // Apply security headers to all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Override cache for static assets — let them be cached properly
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API routes should never be cached
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
