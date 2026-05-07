import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "first_name",
      "last_name",
      "phone_number",
      "password",
      "business_type",
      "country",
      "email",
      "business_name",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { status: 400, message: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Get CSRF cookie first
    await fetch(`${process.env.LARAVEL_API_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
    });

    // Forward registration to Laravel
    const response = await fetch(`${process.env.LARAVEL_API_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

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
