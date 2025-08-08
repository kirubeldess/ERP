import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { access_token, refresh_token, expires_at } = await req.json();
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  const expires = expires_at ? new Date(expires_at * 1000) : undefined;
  res.cookies.set({ name: "sb-access-token", value: access_token, httpOnly: false, sameSite: "lax", path: "/", expires });
  res.cookies.set({ name: "sb-refresh-token", value: refresh_token, httpOnly: false, sameSite: "lax", path: "/" });
  return res;
} 