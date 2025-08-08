import { NextResponse } from "next/server";
import { createServerSession } from "@/lib/session";

export async function POST(req: Request) {
  const { access_token, refresh_token, expires_at, user_id } = await req.json();
  if (!access_token || !refresh_token || !user_id) {
    return NextResponse.json({ error: "Missing tokens or user" }, { status: 400 });
  }

  const sessionId = await createServerSession({
    userId: user_id,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: expires_at,
  });

  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({ name: "SESSION_ID", value: sessionId, httpOnly: true, sameSite: "lax", secure: isProd, path: "/" });
  return res;
} 