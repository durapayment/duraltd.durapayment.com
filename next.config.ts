import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Your exact Laravel API domain — no wildcards
const API_DOMAIN = "https://api.durapayment.com";
const FRONTEND_DOMAIN = "https://online.durapayment.com";

const securityHeaders = [
  // ── Fixes: Missing Anti-clickjacking Header ──────────────────────────────
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // ── Fixes: X-Content-Type-Options Header Missing ─────────────────────────
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // ── HSTS ─────────────────────────────────────────────────────────────────
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // ── Referrer ─────────────────────────────────────────────────────────────
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // ── Permissions ──────────────────────────────────────────────────────────
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },

  // ── Fixes: CSP: Wildcard Directive ───────────────────────────────────────
  // ── Fixes: CSP: script-src unsafe-inline ────────────────────────────────
  // ── Fixes: CSP: style-src unsafe-inline ─────────────────────────────────
  // ── Fixes: Content Security Policy Header Not Set ───────────────────────
  //
  // NOTE: Next.js 13+ App Router inlines scripts by default.
  // To fully remove unsafe-inline from script-src you need to implement
  // nonce-based CSP (see comment below). For now this is the safest
  // practical config that removes the wildcard and unsafe-eval in prod.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",

      // unsafe-inline is required by Next.js for hydration scripts.
      // Remove unsafe-eval in production (only needed for dev HMR).
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",

      // unsafe-inline required for Tailwind/CSS-in-JS
      "style-src 'self' 'unsafe-inline'",

      // Images — no wildcard, explicit sources only
      "img-src 'self' data: blob: https://img.heroui.chat",

      // Fonts
      "font-src 'self' data:",

      // API calls — explicit domains, no wildcards
      `connect-src 'self' ${API_DOMAIN} ${FRONTEND_DOMAIN}`,

      // No iframes
      "frame-src 'none'",
      "frame-ancestors 'none'",

      // No plugins
      "object-src 'none'",

      // Prevent base tag hijacking
      "base-uri 'self'",

      // Forms only submit to same origin
      "form-action 'self'",

      // Force HTTPS for all subresources
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Removes X-Powered-By: Next.js header
  // poweredByHeader: false,

  // Strip console.log in production builds
  // Helps with: Information Disclosure - Suspicious Comments
  // compiler: {
  //   removeConsole: !isDev ? { exclude: ["error", "warn"] } : false,
  // },

  // async headers() {
  //   return [
  //     // Security headers on all pages
  //     {
  //       source: "/(.*)",
  //       headers: securityHeaders,
  //     },
  //     // Static assets — long cache, immutable
  //     {
  //       source: "/_next/static/(.*)",
  //       headers: [
  //         {
  //           key: "Cache-Control",
  //           value: "public, max-age=31536000, immutable",
  //         },
  //       ],
  //     },
  //     // API proxy routes — never cache
  //     {
  //       source: "/api/(.*)",
  //       headers: [
  //         {
  //           key: "Cache-Control",
  //           value: "no-store, no-cache, must-revalidate, proxy-revalidate",
  //         },
  //         {
  //           key: "Pragma",
  //           value: "no-cache",
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;

/*
 * ── To fully eliminate unsafe-inline from script-src (advanced) ──────────────
 *
 * Next.js App Router supports nonce-based CSP via middleware:
 *
 * 1. Create middleware.ts at project root:
 *
 *   import { NextResponse } from 'next/server'
 *   import type { NextRequest } from 'next/server'
 *   import { nanoid } from 'nanoid'
 *
 *   export function middleware(request: NextRequest) {
 *     const nonce = nanoid()
 *     const csp = `script-src 'self' 'nonce-${nonce}'; ...`
 *     const response = NextResponse.next()
 *     response.headers.set('Content-Security-Policy', csp)
 *     response.headers.set('x-nonce', nonce)
 *     return response
 *   }
 *
 * 2. Pass nonce to <Script> components via headers().get('x-nonce')
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */
