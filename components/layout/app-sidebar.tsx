"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/rbac";
import { navItems as all } from "@/components/layout/nav-items";

export function AppSidebar({ initialRole = "staff" as UserRole }: { initialRole?: UserRole }) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(initialRole);

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

  const items = all.filter((item) => {
    if (item.key === "finance" && role === "staff") return false;
    return true;
  });

  return (
    <div className="hidden md:block">
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
    </div>
  );
} 