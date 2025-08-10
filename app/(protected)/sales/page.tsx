"use client";

import { useEffect, useMemo, useState } from "react";
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

  function pick<T = any>(res: any): T[] {
    if (!res) return [];
    if (Array.isArray(res)) return res as T[];
    if (Array.isArray(res.data)) return res.data as T[];
    return [];
  }

  async function load() {
    try {
      const ts = Date.now();
      const [invRes, ldRes, prodRes] = await Promise.all([
        fetch(`/api/invoices/list?ts=${ts}`, { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch(`/api/leads/list?ts=${ts}`, { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch(`/api/products/list?ts=${ts}`, { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      ]);
      setInvoices(pick(invRes));
      setLeads(pick(ldRes));
      setProducts(pick(prodRes));
    } catch {
      setInvoices([]);
      setLeads([]);
      setProducts([]);
    }
  }

  useEffect(() => { load(); }, []);

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
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      await load();
    } else {
      alert((body as any).error || "Failed to create invoice");
    }

    setSaving(false);
    setOpen(false);
    setAmount("");
    setCustomerId("");
    setProductId("");
    setProductName("");
    setQuantity(1);
  }

  const productOptions = useMemo(() => products.map((p: any) => ({ value: p.id, label: `${p.name} (qty ${p.quantity})` })), [products]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales & CRM</h1>
        <Button onClick={() => setOpen(true)}>New invoice</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1">
        <div className="min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Recent invoices</h2>
            <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          </div>
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
                  <SelectValue placeholder="Select product (optional, for stock decrement)" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Or type product name (note only)" value={productName} onChange={(e) => { setProductName(e.target.value); setProductId(""); }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              <Input type="number" placeholder="Amount in Birr" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
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