import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return <main className="admin-shell narrow"><div className="admin-brand">M3 Memory Archive</div><section className="admin-card"><h1>Control Room</h1><p>Sign in with the existing archive administrator account.</p><LoginForm /></section></main>;
}
