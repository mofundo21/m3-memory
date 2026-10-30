import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { signOut } from "./actions";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const db = createSupabaseAdmin();
  let query = db.from("submissions").select("id,reference_code,memory_preview,status,created_at,persons(display_name)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: submissions, error } = await query;
  if (error) throw error;
  return <main className="admin-shell"><header className="admin-top"><div><div className="admin-brand">M3 Memory Archive</div><h1>Control Room</h1></div><form action={signOut}><button className="admin-secondary">Sign out</button></form></header><nav className="admin-filters"><Link href="/admin">All</Link>{["UNREVIEWED","IN_REVIEW","NEEDS_FOLLOW_UP","APPROVED","ARCHIVED"].map((item)=><Link key={item} className={status===item?"active":""} href={`/admin?status=${item}`}>{item.replaceAll("_"," ")}</Link>)}</nav><section className="admin-card"><div className="admin-list-head"><h2>Submissions</h2><span>{submissions?.length || 0} shown</span></div>{!submissions?.length ? <p>No submissions in this view.</p> : <div className="submission-list">{submissions.map((submission) => { const person = Array.isArray(submission.persons) ? submission.persons[0] : submission.persons; return <Link className="submission-row" href={`/admin/submissions/${submission.id}`} key={submission.id}><div><strong>{person?.display_name || "Unknown contributor"}</strong><p>{submission.memory_preview || "No preview"}</p></div><div className="submission-meta"><span className="status-pill">{submission.status}</span><small>{submission.reference_code || submission.id.slice(0,8)}</small><small>{new Date(submission.created_at).toLocaleDateString()}</small></div></Link>; })}</div>}</section></main>;
}
