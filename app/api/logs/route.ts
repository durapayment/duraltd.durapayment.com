import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "20";
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const status = searchParams.get("status") || "";
    const date_range = searchParams.get("date_range") || "";

    const params = new URLSearchParams({ page, per_page });
    if (search) params.set("search", search);
    if (action && action !== "all") params.set("action", action);
    if (status && status !== "all") params.set("status", status);
    if (date_range && date_range !== "all")
      params.set("date_range", date_range);

    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/user/logs?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Logs API route error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
