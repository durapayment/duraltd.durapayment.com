import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

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
    const amount = body.amount;
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
    if (!amount) {
      return NextResponse.json(
        { status: 400, message: "Bad request" },
        { status: 400 },
      );
    }

    // ── Idempotency Key ────────────────────────────────────
    const idempotencyKey = randomUUID();

    // Forward to Laravel
    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/transactions/transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        cache: "no-store",
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    const setCookieHeader = response.headers.get("set-cookie");

    const nextResponse = NextResponse.json(data, { status: response.status });

    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    // ── Forward idempotency key back to client ─────────────
    // So client can track which key was used
    nextResponse.headers.set("Idempotency-Key", idempotencyKey);

    return nextResponse;
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 },
    );
  }
}
