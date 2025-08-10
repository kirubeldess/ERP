import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, location } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("warehouses")
    .insert({ user_id: user.id, name, location: location || null })
    .select("id, name, location")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
} 