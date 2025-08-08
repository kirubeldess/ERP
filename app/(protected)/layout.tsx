import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("SESSION_ID")?.value);
  if (!hasSession) redirect("/login");

  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex min-h-screen flex-col">
          <MobileNav />
          <div className="hidden md:flex items-center gap-2 p-2 border-b">
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