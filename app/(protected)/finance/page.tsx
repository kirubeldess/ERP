"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/currency";

export default function FinancePage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");

  async function load() {
    const res = await fetch("/api/ledger/list", { cache: "no-store" });
    const body = await res.json();
    setLedger((body?.data as any[]) || []);
  }

  useEffect(() => { load(); }, []);

  async function addEntry() {
    await fetch("/api/ledger/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, description }),
    });
    setOpen(false);
    setAmount(0);
    setDescription("");
    setType("income");
    load();
  }

  const series = useMemo(() => ledger.map((l) => ({ date: l.date, value: l.type === "income" ? l.amount : -l.amount })), [ledger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Finance & Accounting</h1>
        <Button onClick={() => setOpen(true)}>Add entry</Button>
      </div>

      <ChartContainer className="h-64" config={{ value: { label: "Net (ETB)" } }}>
        <AreaChart data={series}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Area type="monotone" dataKey="value" stroke="#111" fill="#11111122" />
          <ChartTooltip content={<ChartTooltipContent />} />
        </AreaChart>
      </ChartContainer>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(ledger || []).map((l) => (
            <TableRow key={l.id}>
              <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
              <TableCell className={l.type === "income" ? "text-green-600" : "text-red-600"}>{l.type}</TableCell>
              <TableCell>{l.description}</TableCell>
              <TableCell className="text-right">{formatMoney(l.amount)}</TableCell>
            </TableRow>
          ))}
          {!ledger.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">No entries</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New ledger entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Amount in Birr" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={addEntry}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 