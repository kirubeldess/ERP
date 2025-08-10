import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isUuid(v: any) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

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

    const customer_uuid = isUuid(customerId) ? customerId : null;

    const { data: created, error: insErr } = await supabaseAdmin
      .from("invoices")
      .insert({
        customer_id: customer_uuid,
        amount: finalAmount,
        date: new Date().toISOString(),
        status: "paid",
        product_id: selectedProduct?.id || null,
        product_name: finalName,
        quantity: q,
      })
      .select("id, customer_id, date, amount, status, product_id, product_name, quantity")
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    await supabaseAdmin.from("ledger").insert({
      type: "income",
      amount: finalAmount,
      date: new Date().toISOString(),
      description: `Sale: ${finalName} x${q}`,
    });

    return NextResponse.json({ invoice: created, product: selectedProduct });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
} 