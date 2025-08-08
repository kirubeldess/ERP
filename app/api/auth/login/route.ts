import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSession } from "@/lib/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    return NextResponse.json({ error: error?.message || "Invalid credentials" }, { status: 401 });
  }

  const sess = data.session;
  const sessionId = await createServerSession({
    userId: sess.user.id,
    accessToken: sess.access_token,
    refreshToken: sess.refresh_token,
    expiresAt: sess.expires_at,
  });

  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({ name: "SESSION_ID", value: sessionId, httpOnly: true, sameSite: "lax", secure: isProd, path: "/" });
  return res;
} 