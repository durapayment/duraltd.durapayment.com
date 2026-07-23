import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Public route — no auth needed ──────────────────────
    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/admin/auth/resend-otp`,
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
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin resend OTP error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
