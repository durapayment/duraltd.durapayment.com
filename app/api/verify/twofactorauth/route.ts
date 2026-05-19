import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get CSRF cookie
    await fetch(`${process.env.LARAVEL_API_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
    });

    // Forward login to Laravel
    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/verify/twofactorauth`,
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

    const setCookieHeader = response.headers.get("set-cookie");

    const nextResponse = NextResponse.json(data, { status: response.status });

    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
