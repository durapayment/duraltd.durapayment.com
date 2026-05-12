// app/api/keys/generate/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ Server-side can read HttpOnly cookies
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Step 1: Read the incoming body from frontend (password, mode, etc.)
    const body = await request.json();

    // Optional: Validate basic structure (you can add more)
    if (!body.mode || !["test", "live"].includes(body.mode) || !body.password) {
      return NextResponse.json(
        { message: "Missing required fields: mode and password" },
        { status: 400 },
      );
    }

    // Step 2: Forward the exact same body + cookies to Laravel
    const laravelResponse = await fetch(
      `${process.env.LARAVEL_API_URL}/api/user/api-keys/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );

    const data = await laravelResponse.json();

    // Step 3: Create response and forward Set-Cookie headers (important!)
    const nextResponse = NextResponse.json(data, {
      status: laravelResponse.status,
    });

    const setCookieHeaders = laravelResponse.headers.getSetCookie();
    if (setCookieHeaders?.length) {
      setCookieHeaders.forEach((cookie) => {
        nextResponse.headers.append("Set-Cookie", cookie);
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Generate API keys proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
