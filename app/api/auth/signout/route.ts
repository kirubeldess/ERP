import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST(request: Request) {
  const sessionId = request.headers.get("cookie")?.split(";").map((s) => s.trim()).find((c) => c.startsWith("SESSION_ID="))?.split("=")?.[1];
  if (sessionId) {
    await deleteSession(sessionId);
  }
  const res = NextResponse.json({ ok: true });
  const past = new Date(0);
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({ name: "SESSION_ID", value: "", httpOnly: true, sameSite: "lax", secure: isProd, path: "/", expires: past });
  return res;
} 