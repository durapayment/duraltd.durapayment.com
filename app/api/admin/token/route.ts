import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const adminToken = request.cookies.get("admin_token")?.value;

  if (!adminToken) {
    return NextResponse.json(
      { status: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json({ token: adminToken });
}
