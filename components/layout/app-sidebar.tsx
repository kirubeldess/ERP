"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutDashboard, Boxes, Handshake, ReceiptText, Users, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/rbac";

const allItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/inventory", label: "Inventory", icon: Boxes, key: "inventory" },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse, key: "inventory" },
  { href: "/sales", label: "Sales & CRM", icon: Handshake, key: "sales" },
  { href: "/finance", label: "Finance", icon: ReceiptText, key: "finance" },
  { href: "/customers", label: "Customers", icon: Users, key: "customers" },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("staff");

  useEffect(() => {
    let mounted = true;
    async function getRole() {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) return;
      const { data } = await supabaseBrowser.from("users").select("role").eq("id", user.id).single();
      if (mounted && data?.role) setRole(data.role as UserRole);
    }
    getRole();
    return () => { mounted = false; };
  }, []);

  const items = allItems.filter((item) => {
    if (item.key === "finance" && role === "staff") return false;
    return true;
  });

  return (
    <Sidebar collapsible="none">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ERP</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                  <Link href={item.href} className={cn("gap-2")}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
} 