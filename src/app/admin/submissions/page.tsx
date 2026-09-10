export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { listSubmissions } from "@/lib/db";

export default async function AdminSubmissionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const submissions = listSubmissions() as any[];

  return (
    <main className="shell admin-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Memory inbox</strong>
          <span>{submissions.length} private submissions</span>
        </div>
        <Link className="btn" href="/">Public page</Link>
      </header>

      <section className="inbox">
        {submissions.length === 0 ? (
          <div className="panel muted">No submissions yet. The production archive starts empty.</div>
        ) : submissions.map((item) => (
          <Link className="row" key={item.id} href={`/admin/submissions/${item.id}`}>
            <span className="status">{item.status}</span>
            <span>
              <strong>{item.submitterName || "Unknown"}</strong><br />
              <span className="muted">{item.memoryPreview || "No preview"}</span>
            </span>
            <span className="muted">{new Date(item.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
