// app/api/admin/transactions/[id]/retry-float-payout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { uuid } = await params;

    const res = await fetch(
      `${process.env.LARAVEL_API_URL}/api/admin/transactions/${uuid}/retry-float-payout`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Retry float payout error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
