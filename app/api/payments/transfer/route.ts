import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const body = await request.json();
    const bank_code = body.bank_code;
    const account_number = body.account_number;
    const account_name = body.account_name;
    const amount = parseFloat(body.amount);
    const narration = body.narration || "Transfer";

    if (!bank_code || typeof bank_code !== "string") {
      return NextResponse.json(
        { status: 400, message: "Bad request" },
        { status: 400 },
      );
    }
    if (!account_number || typeof account_number !== "string") {
      return NextResponse.json(
        { status: 400, message: "Bad request" },
        { status: 400 },
      );
    }
    if (!account_name || typeof account_name !== "string") {
      return NextResponse.json(
        { status: 400, message: "Bad request" },
        { status: 400 },
      );
    }
    if (!amount || typeof amount !== "string") {
      return NextResponse.json(
        { status: 400, message: "Bad request" },
        { status: 400 },
      );
    }

    // Get CSRF cookie first
    await fetch(`${process.env.LARAVEL_API_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
    });

    // Forward registration to Laravel
    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/transactions/transfer`,
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
