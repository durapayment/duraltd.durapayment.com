import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "./config/site";

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const API_DOMAIN = "https://api.durapayment.com";
  const ADMIN_DOMAIN = "https://admin.durapayment.com";

  const connectSrc = isDev
    ? `connect-src 'self' ${API_DOMAIN} ${ADMIN_DOMAIN} http://localhost:8000 http://127.0.0.1:8000`
    : `connect-src 'self' ${API_DOMAIN} ${ADMIN_DOMAIN}`;

  return [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob: https://img.heroui.chat",
    "font-src 'self' data:",
    connectSrc,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "report-to csp",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = generateNonce();
  const csp = buildCSP(nonce);

  // ── Protect all dashboard routes ───────────────────────────
  if (pathname.startsWith(siteConfig.pagesPaths.dashboard)) {
    const adminToken = request.cookies.get("admin_token")?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ── Forward nonce ──────────────────────────────────────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Reporting-Endpoints",
    'csp="https://admin.durapayment.com/api/csp-report"',
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)).*)",
  ],
};
