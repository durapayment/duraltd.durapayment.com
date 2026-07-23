import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const res = await fetch(
      `${process.env.LARAVEL_API_URL}/api/admin/businesses/${id}`,
      {
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
    console.error("Admin business detail error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
