"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

export type SalesPoint = { date: string; income: number };
export type IncomeExpensePoint = { date: string; income: number; expense: number };

export function DashboardCharts({ sales, incomeVsExpense }: { sales: SalesPoint[]; incomeVsExpense: IncomeExpensePoint[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border rounded-xl p-4">
        <div className="font-medium mb-2">Sales Trend</div>
        <ChartContainer className="h-64" config={{ income: { label: "Income", color: "#16a34a" } }}>
          <AreaChart data={sales}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" hide tickLine={false} axisLine={false} />
            <YAxis hide />
            <Area type="monotone" dataKey="income" stroke="#16a34a" fill="#16a34a22" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="border rounded-xl p-4">
        <div className="font-medium mb-2">Income vs Expense</div>
        <ChartContainer className="h-64" config={{ income: { label: "Income", color: "#2563eb" }, expense: { label: "Expense", color: "#ef4444" } }}>
          <AreaChart data={incomeVsExpense}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" hide tickLine={false} axisLine={false} />
            <YAxis hide />
            <Area type="monotone" dataKey="income" stroke="#2563eb" fill="#2563eb22" />
            <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef444422" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend verticalAlign="bottom" />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
} 