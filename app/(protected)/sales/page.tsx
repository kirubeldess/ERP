"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/currency";

export default function SalesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState<number | "">("");
  const [customerId, setCustomerId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">(1);

  async function load() {
    const [{ data: inv }, { data: ld }, { data: prod }] = await Promise.all([
      supabaseBrowser.from("invoices").select("id, customer_id, date, amount, status, product_id, product_name, quantity").order("date", { ascending: false }).limit(50),
      supabaseBrowser.from("leads").select("id, customer_id, status, notes").limit(50),
      supabaseBrowser.from("products").select("id, name, quantity, price").order("name"),
    ]);
    setInvoices(inv || []);
    setLeads(ld || []);
    setProducts(prod || []);
  }

  useEffect(() => {
    load();
    const ch = supabaseBrowser
      .channel("invoices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, (payload) => {
        if (payload.eventType === "INSERT") setInvoices((prev) => [payload.new as any, ...prev]);
        if (payload.eventType === "UPDATE") setInvoices((prev) => prev.map((r) => (r.id === (payload.new as any).id ? payload.new : r)));
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(ch); };
  }, []);

  async function addInvoice() {
    setSaving(true);
    const q = typeof quantity === "number" ? quantity : Number(quantity) || 1;
    const payload = {
      customerId: customerId || null,
      productId: productId || null,
      productName: productName || "",
      quantity: q,
      amount: typeof amount === "number" ? amount : null,
    };

    const res = await fetch("/api/sales/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (res.ok) {
      if (body.invoice) setInvoices((prev: any[]) => [body.invoice, ...prev]);
      if (body.product) setProducts((prev: any[]) => prev.map((p) => (p.id === body.product.id ? body.product : p)));
    }

    setSaving(false);
    setOpen(false);
    setAmount("");
    setCustomerId("");
    setProductId("");
    setProductName("");
    setQuantity(1);
  }

  const productOptions = useMemo(() => products.map((p) => ({ value: p.id, label: `${p.name} (qty ${p.quantity})` })), [products]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales & CRM</h1>
        <Button onClick={() => setOpen(true)}>New invoice</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1">
        <div className="min-h-0 flex flex-col">
          <h2 className="mb-2 font-medium">Recent invoices</h2>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoices || []).map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                    <TableCell>{inv.customer_id || "—"}</TableCell>
                    <TableCell>{inv.product_name || inv.product_id || "—"}</TableCell>
                    <TableCell className="text-right">{inv.quantity ?? 1}</TableCell>
                    <TableCell className="text-right">{formatMoney(Number(inv.amount || 0))}</TableCell>
                    <TableCell className="text-right">{inv.status}</TableCell>
                  </TableRow>
                ))}
                {!invoices.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No invoices</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="min-h-0 flex flex-col">
          <h2 className="mb-2 font-medium">Leads</h2>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leads || []).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.customer_id}</TableCell>
                    <TableCell>{l.status}</TableCell>
                    <TableCell>{l.notes}</TableCell>
                  </TableRow>
                ))}
                {!leads.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No leads</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Customer ID (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
            <div className="grid gap-2">
              <Select value={productId || undefined} onValueChange={(v) => { setProductId(v); setProductName(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product from inventory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Or type product name" value={productName} onChange={(e) => { setProductName(e.target.value); setProductId(""); }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              <Input type="number" placeholder="Amount in Birr (auto if product selected)" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={saving} onClick={addInvoice}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 