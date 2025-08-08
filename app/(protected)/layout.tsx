import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Preload user row to help client fetch role quickly
  await supabase.from("users").select("id").eq("id", session.user.id).maybeSingle();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex min-h-screen flex-col">
          <div className="flex items-center gap-2 p-2 border-b">
            <SidebarTrigger />
            <div className="ml-auto" />
            <Topbar />
          </div>
          <main className="flex-1 p-4 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 