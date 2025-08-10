import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, amount, description } = await req.json();
  if (!type || typeof amount !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ledger")
    .insert({ user_id: user.id, type, amount, date: new Date().toISOString(), description })
    .select("id, type, amount, date, description")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
} 