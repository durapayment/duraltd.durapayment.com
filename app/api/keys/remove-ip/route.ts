// app/api/keys/add-ip/route.ts

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

    // Step 1: Read the incoming body from frontend
    const body = await request.json();

    // Validate required fields
    if (!body.ip) {
      return NextResponse.json(
        { message: "IP address is required" },
        { status: 400 },
      );
    }

    if (!body.api_key_id) {
      return NextResponse.json(
        { message: "API key ID is required" },
        { status: 400 },
      );
    }

    // Step 2: Forward to Laravel with api_key_id in the URL
    const laravelResponse = await fetch(
      `${process.env.LARAVEL_API_URL}/api/user/api-keys/${body.api_key_id}/ip/remove`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ ip: body.ip }),
      },
    );

    const data = await laravelResponse.json();

    // Step 3: Create response and forward Set-Cookie headers
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
    console.error("Add IP proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
