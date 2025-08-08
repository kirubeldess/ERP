import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const past = new Date(0);
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({ name: "sb-access-token", value: "", httpOnly: true, sameSite: "lax", secure: isProd, path: "/", expires: past });
  res.cookies.set({ name: "sb-refresh-token", value: "", httpOnly: true, sameSite: "lax", secure: isProd, path: "/", expires: past });
  return res;
} 