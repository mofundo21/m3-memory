export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAuthMode, requireAdmin, logout } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import { PolaroidCard } from "@/components/PolaroidCard";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/admin/login");
}

export default async function AdminArchivePage() {
  let adminToken: string | null;
  try {
    adminToken = await requireAdmin();
  } catch {
    redirect(getAdminAuthMode() === "supabase" ? "/admin/login?error=expired" : "/admin/login");
  }

  // Demo data - development only, no real queries
  const demoMemories = [
    { label: "The Piano in the Woods", rotation: -2 },
    { label: "Sunrise Conversation", rotation: 1 },
    { label: "The Gas Station", rotation: -3 },
    { label: "Chess and Life", rotation: 2 }
  ];

  return (
    <main className="shell">
      <div className="admin-layout">
        <AdminSidebar currentPath="/admin/archive" />

        <div>
          <header className="topbar" style={{ gridColumn: '1 / 3', marginBottom: '24px' }}>
            <div className="brand">
              <strong>The Archive</strong>
              <span>Search and explore</span>
            </div>
            <div className="actions">
              <Link className="btn" href="/">Public</Link>
              <form action={logoutAction}>
                <button className="btn" type="submit">Sign out</button>
              </form>
            </div>
          </header>

          <div className="field" style={{ marginBottom: '32px' }}>
            <label>Search memories, people, events</label>
            <input type="text" placeholder="Coming soon..." disabled style={{ opacity: '0.5' }} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', marginBottom: '24px' }}>Featured Memories</h2>
          <div className="gallery">
            {demoMemories.map((memory, i) => (
              <PolaroidCard key={i} label={memory.label} rotation={memory.rotation} />
            ))}
          </div>

          <p className="micro-note" style={{ marginTop: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            Archive search and full navigation coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
