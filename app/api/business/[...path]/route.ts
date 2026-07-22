import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LARAVEL_API =
  process.env.LARAVEL_API_URL ?? "https://api.durapayment.com";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { status: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { path } = await params;
  const url = `${LARAVEL_API}/api/business/${path.join("/")}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);

  const contentType = request.headers.get("Content-Type") ?? "";

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    // @ts-expect-error — Node.js fetch supports duplex
    duplex: "half",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    if (contentType.includes("multipart/form-data")) {
      // ── Stream directly — avoids buffering the entire file ──
      init.body = request.body;
      // Forward the original Content-Type with boundary
      headers.set("Content-Type", contentType);
    } else if (contentType.includes("application/json")) {
      headers.set("Content-Type", "application/json");
      init.body = await request.text();
    } else {
      init.body = await request.text();
    }
  }

  try {
    const res = await fetch(url, init);
    const data = await res.blob();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("[business proxy error]", err);
    return NextResponse.json({ message: "Proxy error" }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
