import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSessionById } from "@/lib/session";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("SESSION_ID")?.value;

  let accessToken: string | undefined;
  if (sessionId) {
    const sess = await getSessionById(sessionId);
    accessToken = sess?.access_token || undefined;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  return supabase;
} 