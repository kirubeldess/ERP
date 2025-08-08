"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function MobileNav() {
  const pathname = usePathname();

  async function signOut() {
    try {
      await supabaseBrowser.auth.signOut();
    } catch {}
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <nav className="md:hidden sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {/* <span>{item.label}</span> */}
              </Link>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
} 