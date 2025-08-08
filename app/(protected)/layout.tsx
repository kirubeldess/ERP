import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Preload user row to help client fetch role quickly
  await supabase.from("users").select("id").eq("id", session.user.id).maybeSingle();

  return (
    <SidebarProvider>
      <div className="grid grid-cols-[auto_1fr] min-h-screen">
        <AppSidebar />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 p-2 border-b">
            <SidebarTrigger />
            <div className="ml-auto" />
            <Topbar />
          </div>
          <main className="p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
} 