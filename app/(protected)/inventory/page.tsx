"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = { id: string; name: string; category: string | null; quantity: number; price: number; warehouse_id: string | null; supplier_id?: string | null };

type Warehouse = { id: string; name: string };

type Supplier = { id: string; name: string };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<Partial<Product>>({ name: "", category: "", quantity: 0, price: 0, warehouse_id: null, supplier_id: null });

  async function load() {
    const [prodRes, whRes, suRes] = await Promise.all([
      fetch("/api/products/list").then((r) => r.json()),
      fetch("/api/warehouses/list").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/suppliers/list").then((r) => r.json()).catch(() => ({ data: [] })),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setWarehouses((whRes.data as Warehouse[]) || []);
    setSuppliers((suRes.data as Supplier[]) || []);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    if (editing) {
      const res = await fetch(`/api/products/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      const body = await res.json();
      if (!res.ok) alert(body.error || "Failed to save");
      if (body.data) setProducts((prev) => prev.map((p) => (p.id === body.data.id ? body.data : p)));
    } else {
      const res = await fetch(`/api/products/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) alert(body.error || "Failed to create");
      if (body.data) setProducts((prev) => [body.data, ...prev]);
    }
    setSaving(false);
    setOpen(false);
    setEditing(null);
    setForm({ name: "", category: "", quantity: 0, price: 0, warehouse_id: null, supplier_id: null });
  }

  async function remove(id: string) {
    const res = await fetch(`/api/products/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const body = await res.json();
    if (!res.ok) alert(body.error || "Failed to delete");
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  function startEdit(p?: Product) {
    if (p) {
      setEditing(p);
      setForm(p);
    } else {
      setEditing(null);
      setForm({ name: "", category: "", quantity: 0, price: 0, warehouse_id: null, supplier_id: null });
    }
    setOpen(true);
  }

  const lowStock = useMemo(() => products.filter((p) => (p.quantity ?? 0) < 5), [products]);

  const filteredProducts = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(lowerSearch) ||
      (p.category?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [products, search]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button onClick={() => startEdit()}>Add product</Button>
      </div>
      <div className="text-sm text-muted-foreground">Low stock: {lowStock.length}</div>

      <Input
        placeholder="Search products by name or category"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="my-2"
      />

      <div className="flex-1 overflow-auto mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((p) => (
              <TableRow key={p.id} className={p.quantity < 5 ? "bg-muted/40" : undefined}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{warehouses.find((w) => w.id === p.warehouse_id)?.name || "—"}</TableCell>
                <TableCell>{suppliers.find((s) => s.id === (p as any).supplier_id)?.name || "—"}</TableCell>
                <TableCell className="text-right">{p.quantity}</TableCell>
                <TableCell className="text-right">{p.price?.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!filteredProducts.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No products found</TableCell>
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
            <Select value={form.supplier_id ?? undefined} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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