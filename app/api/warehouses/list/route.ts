import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("warehouses").select("id, name, location").eq("user_id", user.id).order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
} 