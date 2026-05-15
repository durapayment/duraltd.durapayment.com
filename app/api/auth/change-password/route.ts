import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    for (const field of ["email", "otp", "password"]) {
      if (!body[field]) {
        return NextResponse.json(
          { status: 400, message: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    await fetch(`${process.env.LARAVEL_API_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
    });

    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/auth/reset/password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: body.email,
          otp: body.otp,
          password: body.password,
        }),
      },
    );

    const data = await response.json();

    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("Change password (verify OTP) error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
