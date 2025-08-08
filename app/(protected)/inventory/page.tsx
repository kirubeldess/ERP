"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = { id: string; name: string; category: string | null; quantity: number; price: number; warehouse_id: string | null };

type Warehouse = { id: string; name: string };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState<Partial<Product>>({ name: "", category: "", quantity: 0, price: 0, warehouse_id: null });

  async function load() {
    const [{ data: prod }, { data: wh } ] = await Promise.all([
      supabaseBrowser.from("products").select("*").order("name"),
      supabaseBrowser.from("warehouses").select("id, name").order("name"),
    ]);
    setProducts((prod as Product[]) || []);
    setWarehouses((wh as Warehouse[]) || []);
  }

  useEffect(() => {
    load();
    const channel = supabaseBrowser
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        // Optimistic: apply row change locally
        if (payload.eventType === "INSERT") {
          setProducts((prev) => [payload.new as Product, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setProducts((prev) => prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as Product) : p)));
        } else if (payload.eventType === "DELETE") {
          setProducts((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, []);

  async function save() {
    setSaving(true);
    if (editing) {
      const { data } = await supabaseBrowser.from("products").update({
        name: form.name,
        category: form.category,
        quantity: form.quantity,
        price: form.price,
        warehouse_id: form.warehouse_id,
      }).eq("id", editing.id).select("*").single();
      if (data) setProducts((prev) => prev.map((p) => (p.id === data.id ? (data as Product) : p)));
    } else {
      const { data } = await supabaseBrowser.from("products").insert({
        name: form.name,
        category: form.category,
        quantity: form.quantity,
        price: form.price,
        warehouse_id: form.warehouse_id,
      }).select("*").single();
      if (data) setProducts((prev) => [data as Product, ...prev]);
    }
    setSaving(false);
    setOpen(false);
    setEditing(null);
    setForm({ name: "", category: "", quantity: 0, price: 0, warehouse_id: null });
  }

  async function remove(id: string) {
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    const { error } = await supabaseBrowser.from("products").delete().eq("id", id);
    if (error) setProducts(prev);
  }

  function startEdit(p?: Product) {
    if (p) {
      setEditing(p);
      setForm(p);
    } else {
      setEditing(null);
      setForm({ name: "", category: "", quantity: 0, price: 0, warehouse_id: null });
    }
    setOpen(true);
  }

  const lowStock = useMemo(() => products.filter((p) => (p.quantity ?? 0) < 5), [products]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button onClick={() => startEdit()}>Add product</Button>
      </div>
      <div className="text-sm text-muted-foreground">Low stock: {lowStock.length}</div>

      <div className="flex-1 overflow-auto mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} className={p.quantity < 5 ? "bg-muted/40" : undefined}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{warehouses.find((w) => w.id === p.warehouse_id)?.name || "—"}</TableCell>
                <TableCell className="text-right">{p.quantity}</TableCell>
                <TableCell className="text-right">${p.price?.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!products.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No products</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Product name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Category (e.g. Electronics)" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Quantity" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              <Input type="number" placeholder="Unit price" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <Select value={form.warehouse_id ?? undefined} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={saving} onClick={save}>{editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 