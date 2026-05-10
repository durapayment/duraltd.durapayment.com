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

    // Forward logout to Laravel
    const response = await fetch(`${process.env.LARAVEL_API_URL}/api/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    // Clear the cookie
    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.cookies.delete("access_token");

    return nextResponse;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
