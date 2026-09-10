import { redirect } from "next/navigation";
import { getAdminAuthMode, login } from "@/lib/auth";

async function loginAction(formData: FormData) {
  "use server";
  const mode = getAdminAuthMode();
  const result = mode === "supabase"
    ? await login(String(formData.get("email") || ""), String(formData.get("password") || ""))
    : await login(String(formData.get("password") || ""));

  if (result !== "ok") redirect(`/admin/login?error=${result}`);
  redirect("/admin/submissions");
}

function errorMessage(error?: string) {
  if (error === "unauthorized") return "That Supabase user is not on the M3 Memory admin allowlist.";
  if (error === "expired") return "Your admin session expired. Sign in again.";
  if (error) return "Admin sign-in failed.";
  return null;
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const mode = getAdminAuthMode();
  const params = await searchParams;
  const message = errorMessage(params?.error);

  return (
    <main className="shell">
      <form action={loginAction} className="panel grid login-card">
        <div className="brand">
          <strong>M3 Memory Admin</strong>
          <span>Private Yeriel / MOFUNDO review area</span>
        </div>
        <p className="notice">This area contains private contributor originals and Yeriel review notes.</p>
        {message ? <p className="error-note">{message}</p> : null}
        {mode === "supabase" ? (
          <div className="field">
            <label>Admin email</label>
            <input name="email" type="email" required autoComplete="email" />
          </div>
        ) : null}
        <div className="field">
          <label>Admin password</label>
          <input name="password" type="password" required autoComplete={mode === "supabase" ? "current-password" : "off"} />
        </div>
        <button className="btn primary" type="submit">Enter</button>
      </form>
    </main>
  );
}
