import { LayoutDashboard, Boxes, Handshake, ReceiptText, Users, Warehouse, Truck } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/inventory", label: "Inventory", icon: Boxes, key: "inventory" },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse, key: "inventory" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, key: "inventory" },
  { href: "/sales", label: "Sales & CRM", icon: Handshake, key: "sales" },
  { href: "/finance", label: "Finance", icon: ReceiptText, key: "finance" },
  { href: "/customers", label: "Customers", icon: Users, key: "customers" },
] as const; 