"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SuppliersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/suppliers/list", { cache: "no-store" });
    const body = await res.json();
    setRows((body?.data as any[]) || []);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (editing) {
      await fetch("/api/suppliers/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, name, contact_info: contact, notes }) });
    } else {
      await fetch("/api/suppliers/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, contact_info: contact, notes }) });
    }
    setOpen(false);
    setEditing(null);
    setName("");
    setContact("");
    setNotes("");
    load();
  }

  async function remove(id: string) { await fetch("/api/suppliers/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); load(); }

  function startEdit(c?: any) {
    if (c) { setEditing(c); setName(c.name); setContact(c.contact_info || ""); setNotes(c.notes || ""); }
    else { setEditing(null); setName(""); setContact(""); setNotes(""); }
    setOpen(true);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <Button onClick={() => startEdit()}>Add supplier</Button>
      </div>

      <div className="flex-1 overflow-auto mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows || []).map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.contact_info}</TableCell>
                <TableCell>{c.notes}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">No suppliers</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit supplier" : "Add supplier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Contact info" value={contact} onChange={(e) => setContact(e.target.value)} />
            <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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