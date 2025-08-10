import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      name: body.name,
      category: body.category,
      quantity: body.quantity,
      price: body.price,
      warehouse_id: body.warehouse_id || null,
      supplier_id: body.supplier_id || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
} 