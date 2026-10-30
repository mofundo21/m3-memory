import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export default async function FollowUpsPage() {
  await requireAdmin(); const { data } = await createSupabaseAdmin().from("follow_ups").select("status,reason,notes,submissions(id,reference_code,memory_preview,persons(display_name,email,contact,preferred_contact_method),reviews(private_notes))").order("updated_at", { ascending: false });
  return <main className="admin-shell"><AdminNav active="Follow-ups"/><header className="workspace-head"><div><p className="admin-brand">Human follow-through</p><h1>Follow-ups</h1><p>This queue organizes outreach. It never sends messages automatically.</p></div></header><section className="admin-card">{!data?.length?<div className="empty-state"><h2>No follow-ups needed</h2><p>Submissions marked Needs Follow-up will appear here.</p></div>:<div className="followup-list">{data.map((entry,index)=>{const submission=Array.isArray(entry.submissions)?entry.submissions[0]:entry.submissions;const person=Array.isArray(submission?.persons)?submission.persons[0]:submission?.persons;return <Link className="followup-row" href={`/admin/submissions/${submission?.id}`} key={`${submission?.id}-${index}`}><div><strong>{person?.display_name}</strong><p>{entry.reason||submission?.memory_preview}</p><small>{person?.preferred_contact_method||person?.email||person?.contact||"No contact method"}</small></div><span className="status-pill">{entry.status}</span></Link>})}</div>}</section></main>;
}
