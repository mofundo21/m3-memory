import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "./supabase-admin";

export async function getAdminUser() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const auth = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items: Array<{ name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }>) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server component cookie refresh is best-effort. */ }
      },
    },
  });
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const { data: admin } = await createSupabaseAdmin().from("m3_admins").select("id").eq("user_id", user.id).maybeSingle();
  return admin ? user : null;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
