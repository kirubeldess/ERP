import { createSupabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts, type SalesPoint, type IncomeExpensePoint } from "@/components/dashboard/charts";
import Link from "next/link";
import { formatMoney } from "@/lib/currency";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const supabase = await createSupabaseServer();

  const sp = await searchParams;
  const range = sp?.range || "today"; // today | 7d | 30d | all

  const since = (() => {
    const now = new Date();
    switch (range) {
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "all": return new Date(0);
      default: return new Date(now.setHours(0, 0, 0, 0));
    }
  })();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) {
    return null;
  }

  const [invRes, ledgerRes] = await Promise.all([
    supabase.from("invoices").select("date, amount, product_id, product_name, quantity").eq("user_id", user.id).gte("date", since.toISOString()).order("date", { ascending: true }),
    supabase.from("ledger").select("date, amount, type").eq("user_id", user.id).gte("date", since.toISOString()).order("date", { ascending: true }),
  ]);

  let best: any[] = [];
  try {
    const { data } = await supabase.rpc("best_selling_products", { since_ts: since.toISOString() });
    best = (data as any[]) || [];
  } catch {
    const { data } = await supabase
      .from("invoices")
      .select("product_id, product_name, quantity")
      .eq("user_id", user.id)
      .gte("date", since.toISOString());
    const counts: Record<string, { name: string; qty: number }> = {};
    (data || []).forEach((r: any) => {
      const key = r.product_id || r.product_name || "unknown";
      const name = r.product_name || r.product_id || "Unknown";
      counts[key] = counts[key] || { name, qty: 0 };
      counts[key].qty += Number(r.quantity || 0);
    });
    best = Object.entries(counts).map(([key, v]) => ({ id: key, name: v.name, qty: v.qty }));
  }

  const sales = invRes.data || [];
  const ledger = ledgerRes.data || [];

  const salesSeries: SalesPoint[] = sales.map((s: any) => ({ date: s.date, income: Number(s.amount) || 0 }));
  const incomeVsExpense: IncomeExpensePoint[] = ledger.map((r: any) => ({
    date: r.date,
    income: r.type === "income" ? Number(r.amount) || 0 : 0,
    expense: r.type === "expense" ? Number(r.amount) || 0 : 0,
  }));

  const totalSales = sales.reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
  const ledgerIncome = ledger.reduce((acc: number, r: any) => acc + (r.type === "income" ? Number(r.amount) || 0 : 0), 0);
  const ledgerExpense = ledger.reduce((acc: number, r: any) => acc + (r.type === "expense" ? Number(r.amount) || 0 : 0), 0);
  const net = ledgerIncome + totalSales - ledgerExpense;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-green-950 text-white">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Sales</CardTitle>
            <div className="text-sm flex items-center gap-2">
              <Link href="/dashboard?range=today" className={range === "today" ? "underline" : ""}>Today</Link>
              <Link href="/dashboard?range=7d" className={range === "7d" ? "underline" : ""}>7d</Link>
              <Link href="/dashboard?range=30d" className={range === "30d" ? "underline" : ""}>30d</Link>
              <Link href="/dashboard?range=all" className={range === "all" ? "underline" : ""}>All</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatMoney(totalSales)}</div>
            <div className="text-sm/relaxed opacity-80">Total sales in selected range</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatMoney(net)}</div>
            <div className="text-sm text-muted-foreground">(Ledger income + Sales) minus Expenses</div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts sales={salesSeries} incomeVsExpense={incomeVsExpense} />

      <Card>
        <CardHeader>
          <CardTitle>Best Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Quantity sold</th>
                </tr>
              </thead>
              <tbody>
                {(best || []).map((row: any) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4">{row.qty}</td>
                  </tr>
                ))}
                {!best.length && (
                  <tr>
                    <td colSpan={2} className="py-3 text-center text-muted-foreground">No sales</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 