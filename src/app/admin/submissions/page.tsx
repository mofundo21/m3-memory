export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAuthMode, requireAdmin, logout } from "@/lib/auth";
import { listSubmissions } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatusBadge } from "@/components/StatusBadge";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/admin/login");
}

function place(item: any) {
  return [item.eventName, item.locationName, item.city, item.region, item.country].filter(Boolean).join(" / ") || "No place";
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
    <main className="shell">
      <div className="admin-layout">
        <AdminSidebar currentPath="/admin/submissions" />

        <div>
          <header className="topbar" style={{ gridColumn: '1 / 3', marginBottom: '24px' }}>
            <div className="brand">
              <strong>Submissions</strong>
              <span>{submissions.length} memories</span>
            </div>
            <div className="actions">
              <Link className="btn" href="/">Public</Link>
              <form action={logoutAction}>
                <button className="btn" type="submit">Sign out</button>
              </form>
            </div>
          </header>

          <section className="inbox">
            {submissions.length === 0 ? (
              <div className="panel" style={{ color: 'var(--muted)' }}>No submissions yet. The production archive starts empty.</div>
            ) : submissions.map((item) => (
              <Link className="row rich-row" key={item.id} href={`/admin/submissions/${item.id}`}>
                <StatusBadge status={item.status} />
                <span className="row-main">
                  <strong>{item.submitterName || "Anonymous"}</strong>
                  <span className="muted">{item.memoryPreview || "No preview"}</span>
                  <span className="row-meta">{item.encounterDate || "No date"} · {place(item)}</span>
                </span>
                <span className="muted" style={{ fontSize: '13px' }}>{new Date(item.createdAt).toLocaleString()}</span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
