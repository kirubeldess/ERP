"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function Topbar() {
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center justify-end gap-2 p-2 border-b">
      <ThemeToggle />
      <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
    </div>
  );
} 