export function formatMoney(amount: number | null | undefined) {
  const value = typeof amount === "number" ? amount : Number(amount || 0);
  return new Intl.NumberFormat("eng", { style: "currency", currency: "ETB" }).format(value);
} 