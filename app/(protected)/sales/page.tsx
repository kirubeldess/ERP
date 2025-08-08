"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SalesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [customerId, setCustomerId] = useState<string>("");

  async function load() {
    const [{ data: inv }, { data: ld }] = await Promise.all([
      supabaseBrowser.from("invoices").select("id, customer_id, date, amount, status").order("date", { ascending: false }).limit(20),
      supabaseBrowser.from("leads").select("id, customer_id, status, notes").limit(20),
    ]);
    setInvoices(inv || []);
    setLeads(ld || []);
  }

  useEffect(() => {
    load();
    const ch = supabaseBrowser
      .channel("invoices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, load)
      .subscribe();
    return () => { supabaseBrowser.removeChannel(ch); };
  }, []);

  async function addInvoice() {
    await supabaseBrowser.from("invoices").insert({ customer_id: customerId || null, amount, date: new Date().toISOString(), status: "pending" });
    setOpen(false);
    setAmount(0);
    setCustomerId("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales & CRM</h1>
        <Button onClick={() => setOpen(true)}>New invoice</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-medium">Recent invoices</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoices || []).map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                  <TableCell>{inv.customer_id || "—"}</TableCell>
                  <TableCell className="text-right">${inv.amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{inv.status}</TableCell>
                </TableRow>
              ))}
              {!invoices.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No invoices</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div>
          <h2 className="mb-2 font-medium">Leads</h2>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Customer ID (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
            <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={addInvoice}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 