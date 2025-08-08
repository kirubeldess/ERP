"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-5 rounded-md px-4 py-2 text-sm transition-colors",
                isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {/* <span>{item.label}</span> */}
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 