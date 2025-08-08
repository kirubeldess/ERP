import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { customerId, productId, productName, quantity, amount } = await req.json();

    const q = Math.max(1, Number(quantity) || 1);
    let selectedProduct: any = null;

    if (productId) {
      const { data: prod, error: prodErr } = await supabaseAdmin
        .from("products")
        .select("id, name, quantity, price")
        .eq("id", productId)
        .single();
      if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 400 });
      selectedProduct = prod;
    }

    const finalName: string = selectedProduct?.name || productName || "Item";
    const finalAmount: number = typeof amount === "number" && amount > 0
      ? amount
      : (selectedProduct ? Number(selectedProduct.price || 0) * q : 0);

    if (selectedProduct) {
      const newQty = Math.max(0, Number(selectedProduct.quantity || 0) - q);
      const { error: updErr } = await supabaseAdmin
        .from("products")
        .update({ quantity: newQty })
        .eq("id", selectedProduct.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      selectedProduct.quantity = newQty;
    }

    const { data: created, error: insErr } = await supabaseAdmin
      .from("invoices")
      .insert({
        customer_id: customerId || null,
        amount: finalAmount,
        product_id: selectedProduct?.id || null,
        product_name: finalName,
        quantity: q,
        date: new Date().toISOString(),
        status: "paid",
      })
      .select("*")
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    return NextResponse.json({ invoice: created, product: selectedProduct });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
} 