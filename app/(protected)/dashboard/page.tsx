import { createSupabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts, type SalesPoint, type IncomeExpensePoint } from "@/components/dashboard/charts";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const [{ data: sales }, { data: inventory }, { data: revenue }] = await Promise.all([
    supabase.from("invoices").select("date, amount").order("date", { ascending: true }).limit(30),
    supabase.from("products").select("name, quantity").limit(10),
    supabase.from("ledger").select("date, amount, type").order("date", { ascending: true }).limit(30),
  ]);

  const salesSeries: SalesPoint[] = (sales || []).map((s: any) => ({ date: s.date, income: Number(s.amount) || 0 }));
  const incomeVsExpense: IncomeExpensePoint[] = (revenue || []).map((r: any) => ({
    date: r.date,
    income: r.type === "income" ? Number(r.amount) || 0 : 0,
    expense: r.type === "expense" ? Number(r.amount) || 0 : 0,
  }));

  return (
    <div className="space-y-4">
      <DashboardCharts sales={salesSeries} incomeVsExpense={incomeVsExpense} />

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6">
            {(inventory || [])
              .filter((p: any) => (p.quantity ?? 0) < 5)
              .map((p: any) => (
                <li key={p.name}>{p.name} — Qty: {p.quantity}</li>
              ))}
            {!inventory?.length && <li>No products found.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 