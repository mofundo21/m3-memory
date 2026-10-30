import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export default async function BookDeskPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireAdmin(); const { category } = await searchParams; const db = createSupabaseAdmin();
  let query = db.from("book_desk_entries").select("category,notes,submissions(id,reference_code,memory_preview,persons(display_name),submission_flags!inner(book_potential))").order("updated_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data } = await query;
  const categories = ["Unsorted","Strong Stories","Strong Quotes","Stories I Forgot","Needs Interview","Needs Verification","Photo Evidence","Early History","Festival Stories","Major Turning Points"];
  return <main className="admin-shell"><AdminNav active="Book Desk" /><header className="workspace-head"><div><p className="admin-brand">Research workspace</p><h1>Book Desk</h1><p>Private organization for material that may belong in the book. No prose is generated here.</p></div></header><nav className="admin-filters"><Link href="/admin/book-desk">All</Link>{categories.map((item)=><Link href={`/admin/book-desk?category=${encodeURIComponent(item)}`} className={category===item?"active":""} key={item}>{item}</Link>)}</nav><section className="admin-card">{!data?.length?<Empty title="No material in this view" text="Mark a submission as Book Potential to bring it into the Book Desk."/>:<div className="submission-list">{data.map((entry, index)=>{const submission=Array.isArray(entry.submissions)?entry.submissions[0]:entry.submissions;const person=Array.isArray(submission?.persons)?submission.persons[0]:submission?.persons;return <Link className="submission-row" href={`/admin/submissions/${submission?.id}`} key={`${submission?.id}-${index}`}><div><strong>{person?.display_name||"Unknown person"}</strong><p>{submission?.memory_preview}</p></div><div className="submission-meta"><span className="status-pill">{entry.category}</span><small>{submission?.reference_code}</small></div></Link>})}</div>}</section></main>;
}
function Empty({title,text}:{title:string;text:string}){return <div className="empty-state"><h2>{title}</h2><p>{text}</p></div>}
