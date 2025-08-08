import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export function generateSessionId(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function createServerSession(params: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: number | null;
}) {
  const id = generateSessionId();
  const expiresAtIso = params.expiresAt ? new Date(params.expiresAt * 1000).toISOString() : null;
  await supabaseAdmin.from("sessions").insert({
    id,
    user_id: params.userId,
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
    expires_at: expiresAtIso,
  });
  return id;
}

export async function getSessionById(id: string) {
  const { data } = await supabaseAdmin
    .from("sessions")
    .select("id, user_id, access_token, refresh_token, expires_at")
    .eq("id", id)
    .maybeSingle();
  return data as { id: string; user_id: string; access_token: string; refresh_token: string; expires_at: string | null } | null;
}

export async function deleteSession(id: string) {
  await supabaseAdmin.from("sessions").delete().eq("id", id);
} 