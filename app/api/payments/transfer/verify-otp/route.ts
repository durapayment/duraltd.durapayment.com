import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const otp = body.otp;

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { status: 400, message: "Invalid otp" },
        { status: 400 },
      );
    }

    // Get CSRF cookie first
    await fetch(`${process.env.LARAVEL_API_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
    });

    // Forward registration to Laravel
    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    // ✅ Extract cookie from Laravel response
    const setCookieHeader = response.headers.get("set-cookie");

    const nextResponse = NextResponse.json(data, { status: response.status });

    // ✅ Forward the cookie to the client
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
