import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data: userData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 400 });
  }

  if (userData.user) {
    await supabaseAdmin.from("users").upsert({ id: userData.user.id, name, email, role: "staff" }, { onConflict: "id" });
  }

  return NextResponse.json({ ok: true });
} 