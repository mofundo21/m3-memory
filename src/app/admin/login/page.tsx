import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

async function loginAction(formData: FormData) {
  "use server";
  const ok = await login(String(formData.get("password") || ""));
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin/submissions");
}

export default function LoginPage() {
  return (
    <main className="shell">
      <form action={loginAction} className="panel grid login-card">
        <div className="brand">
          <strong>M3 Memory Admin</strong>
          <span>Private Yeriel / MOFUNDO review area</span>
        </div>
        <p className="notice">This area contains private contributor originals and Yeriel review notes.</p>
        <div className="field">
          <label>Admin password</label>
          <input name="password" type="password" required />
        </div>
        <button className="btn primary" type="submit">Enter</button>
      </form>
    </main>
  );
}
