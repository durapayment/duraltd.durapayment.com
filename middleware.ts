import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "./config/site";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(siteConfig.pagesPaths.dashboard)) {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // ✅ Call Laravel directly from middleware (server-side)
    try {
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const res = NextResponse.redirect(new URL("/", request.url));
        res.cookies.delete("access_token");
        return res;
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Middleware error:", error);
      const res = NextResponse.redirect(new URL("/", request.url));
      res.cookies.delete("access_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
