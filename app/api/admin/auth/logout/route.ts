import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;

    if (adminToken) {
      await fetch(`${process.env.LARAVEL_API_URL}/api/admin/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    }

    const res = NextResponse.json({ status: 200, message: "Logged out" });
    res.cookies.delete("admin_token");
    return res;
  } catch (error) {
    console.error("Admin logout error:", error);
    const res = NextResponse.json({ status: 200, message: "Logged out" });
    res.cookies.delete("admin_token");
    return res;
  }
}
