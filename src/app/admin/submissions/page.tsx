export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAuthMode, requireAdmin, logout } from "@/lib/auth";
import { listSubmissions } from "@/lib/db";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/admin/login");
}

function place(item: any) {
  return [item.eventName, item.locationName, item.city, item.region, item.country].filter(Boolean).join(" / ") || "No place added";
}

export default async function AdminSubmissionsPage() {
  let adminToken: string | null;
  try {
    adminToken = await requireAdmin();
  } catch {
    redirect(getAdminAuthMode() === "supabase" ? "/admin/login?error=expired" : "/admin/login");
  }
  const submissions = await listSubmissions(adminToken) as any[];

  return (
    <main className="shell admin-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Memory inbox</strong>
          <span>{submissions.length} private submissions</span>
        </div>
        <div className="actions">
          <Link className="btn" href="/">Public page</Link>
          <form action={logoutAction}>
            <button className="btn" type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <section className="inbox">
        {submissions.length === 0 ? (
          <div className="panel muted">No submissions yet. The production archive starts empty.</div>
        ) : submissions.map((item) => (
          <Link className="row rich-row" key={item.id} href={`/admin/submissions/${item.id}`}>
            <span className="status">{item.status}</span>
            <span className="row-main">
              <strong>{item.submitterName || "Anonymous contributor"}</strong>
              <span className="muted">{item.memoryPreview || "No preview"}</span>
              <span className="row-meta">{item.encounterDate || "No date"} · {place(item)}</span>
            </span>
            <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
