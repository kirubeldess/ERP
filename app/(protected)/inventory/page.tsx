"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Product = { id: string; name: string; category: string | null; quantity: number; price: number; warehouse_id: string | null };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState<Partial<Product>>({ name: "", category: "", quantity: 0, price: 0 });

  async function load() {
    const { data } = await supabaseBrowser.from("products").select("*").order("name");
    setProducts((data as Product[]) || []);
  }

  useEffect(() => {
    load();
    const channel = supabaseBrowser
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, []);

  async function save() {
    if (editing) {
      await supabaseBrowser.from("products").update({
        name: form.name,
        category: form.category,
        quantity: form.quantity,
        price: form.price,
      }).eq("id", editing.id);
    } else {
      await supabaseBrowser.from("products").insert({
        name: form.name,
        category: form.category,
        quantity: form.quantity,
        price: form.price,
      });
    }
    setOpen(false);
    setEditing(null);
    setForm({ name: "", category: "", quantity: 0, price: 0 });
  }

  async function remove(id: string) {
    await supabaseBrowser.from("products").delete().eq("id", id);
  }

  function startEdit(p?: Product) {
    if (p) {
      setEditing(p);
      setForm(p);
    } else {
      setEditing(null);
      setForm({ name: "", category: "", quantity: 0, price: 0 });
    }
    setOpen(true);
  }

  const lowStock = useMemo(() => products.filter((p) => (p.quantity ?? 0) < 5), [products]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button onClick={() => startEdit()}>Add product</Button>
      </div>
      <div className="text-sm text-muted-foreground">Low stock: {lowStock.length}</div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
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
              <TableCell colSpan={5} className="text-center text-muted-foreground">No products</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Category" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input type="number" placeholder="Quantity" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <Input type="number" placeholder="Price" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 