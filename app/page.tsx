import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("SESSION_ID")?.value);
  if (!hasSession) redirect("/login");
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}
