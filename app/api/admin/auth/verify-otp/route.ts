import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/admin/auth/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    // ── Forward admin_token cookie ─────────────────────────
    const setCookieHeader = response.headers.get("set-cookie");
    console.log("set-cookie header:", setCookieHeader);
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("Admin verify OTP error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
