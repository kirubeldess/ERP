"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function WarehousesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  async function load() {
    const res = await fetch("/api/warehouses/list", { cache: "no-store" });
    const body = await res.json();
    setRows((body?.data as any[]) || []);
  }

  useEffect(() => { load(); }, []);

  function startEdit(w?: any) {
    if (w) { setEditing(w); setName(w.name); setLocation(w.location || ""); }
    else { setEditing(null); setName(""); setLocation(""); }
    setOpen(true);
  }

  async function save() {
    if (editing) await fetch("/api/warehouses/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, name, location }) });
    else await fetch("/api/warehouses/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, location }) });
    setOpen(false); setEditing(null); setName(""); setLocation(""); load();
  }

  async function remove(id: string) { await fetch("/api/warehouses/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); load(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Warehouses</h1>
        <Button onClick={() => startEdit()}>Add warehouse</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows || []).map((w) => (
            <TableRow key={w.id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>{w.location}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(w)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(w.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {!rows.length && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">No warehouses</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit warehouse" : "Add warehouse"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
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