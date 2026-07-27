import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  try {
    const { id, type } = await params;
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const res = await fetch(
      `${process.env.LARAVEL_API_URL}/api/admin/businesses/${id}/fees/${type}`,
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
    console.error("Fetch business fee detail error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  try {
    const { id, type } = await params;
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const res = await fetch(
      `${process.env.LARAVEL_API_URL}/api/admin/businesses/${id}/fees/${type}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update business fee error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
