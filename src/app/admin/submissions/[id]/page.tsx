export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAdminAuthMode, requireAdmin } from "@/lib/auth";
import { getSubmission, upsertReview, createStoryDraft, getStoryDrafts, getSubmissionMedia } from "@/lib/db";
import { submissionStatuses, type ReviewInput, type SubmissionStatus } from "@/lib/types";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatusBadge } from "@/components/StatusBadge";

async function saveReview(id: string, formData: FormData) {
  "use server";
  const adminToken = await requireAdmin();

  const input: ReviewInput = {
    status: String(formData.get("status") || "UNREVIEWED") as SubmissionStatus,
    notes: String(formData.get("notes") || ""),
    remembered: String(formData.get("remembered") || ""),
    corrections: String(formData.get("corrections") || ""),
    context: String(formData.get("context") || ""),
    people: String(formData.get("people") || ""),
    tags: String(formData.get("tags") || ""),
    importance: Number(formData.get("importance") || "") || undefined,
    emotionalSignificance: Number(formData.get("emotionalSignificance") || "") || undefined,
    historicalSignificance: Number(formData.get("historicalSignificance") || "") || undefined,
    accuracyConfidence: Number(formData.get("accuracyConfidence") || "") || undefined,
    bookPotential: Number(formData.get("bookPotential") || "") || undefined,
    chapterCategory: String(formData.get("chapterCategory") || ""),
    privateNotes: String(formData.get("privateNotes") || "")
  };

  await upsertReview(id, input, adminToken);
  redirect(`/admin/submissions/${id}`);
}

async function createStory(id: string, formData: FormData) {
  "use server";
  const adminToken = await requireAdmin();

  const title = String(formData.get("storyTitle") || "AI-GENERATED DRAFT");
  const body = String(formData.get("storyBody") || "");

  if (!body.trim()) {
    throw new Error("EMPTY_STORY");
  }

  await createStoryDraft(id, title, body, adminToken);
  redirect(`/admin/submissions/${id}`);
}

function OriginalField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="original-field">
      <strong>{label}</strong>
      <p className="muted">{String(value || "-")}</p>
    </div>
  );
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let adminToken: string | null;
  try {
    adminToken = await requireAdmin();
  } catch {
    redirect(getAdminAuthMode() === "supabase" ? "/admin/login?error=expired" : "/admin/login");
  }
  const { id } = await params;
  const submission = await getSubmission(id, adminToken) as any;
  if (!submission) notFound();
  const original = submission.original;
  const review = submission.review || {};

  let storyDrafts: any[] = [];
  try {
    storyDrafts = await getStoryDrafts(id, adminToken) as any[];
  } catch (e) {
    console.error("Failed to load story drafts:", e);
  }

  let media: any[] = [];
  try {
    media = await getSubmissionMedia(id, adminToken) as any[];
  } catch (e) {
    console.error("Failed to load media:", e);
  }

  const canCreateStory = submission.status === "REVIEWED" || submission.status === "APPROVED_FOR_STORY";

  return (
    <main className="shell">
      <div className="admin-layout">
        <AdminSidebar currentPath="/admin/submissions" />

        <div>
          <header className="topbar" style={{ gridColumn: '1 / 3', marginBottom: '24px' }}>
            <div className="brand">
              <strong>Memory Detail</strong>
              <span>{submission.id.slice(0, 8)}...</span>
            </div>
            <Link className="btn" href="/admin/submissions">Back</Link>
          </header>

          <div className="split">
        <section className="panel stack" style={{ background: `linear-gradient(135deg, var(--paper) 0%, rgba(242, 234, 219, 0.05) 100%)`, borderColor: 'rgba(242, 234, 219, 0.2)' }}>
          <div>
            <h2 style={{ color: '#2B2824' }}>🔒 Contributor Original</h2>
            <p className="notice" style={{ background: 'rgba(242, 234, 219, 0.05)', borderColor: 'rgba(242, 234, 219, 0.2)', color: '#2B2824' }}>Immutable source layer. This record cannot be edited.</p>
          </div>
          <OriginalField label="Name" value={original.submitterName} />
          <OriginalField label="Contact" value={original.contact} />
          <OriginalField label="Date" value={original.encounterDate} />
          <OriginalField label="Approximate" value={original.isApproximateDate ? "Yes" : "No"} />
          <OriginalField label="Event" value={original.eventName} />
          <OriginalField label="Location" value={original.locationName} />
          <OriginalField label="City / region / country" value={[original.city, original.region, original.country].filter(Boolean).join(", ")} />
          <OriginalField label="How they met" value={original.howMet} />
          <OriginalField label="Memory" value={original.memoryText} />
          <OriginalField label="Before" value={original.beforeText} />
          <OriginalField label="After" value={original.afterText} />
          <OriginalField label="Repeat encounters" value={original.metAgain} />
          <OriginalField label="Other people" value={original.peoplePresent} />
          <OriginalField label="Yeriel / MOFUNDO wearing" value={original.yerielWearing} />
          <OriginalField label="Contributor wearing" value={original.submitterWearing} />
          <OriginalField label="Conversation" value={original.talkedAbout} />
          <OriginalField label="Exchanged" value={original.exchanged} />
          <OriginalField label="Artifacts" value={original.artifactInfo} />
          <OriginalField label="What Yeriel may not remember" value={original.forgottenPrompt} />
          <OriginalField label="Book page prompt" value={original.bookPagePrompt} />
          <OriginalField label="Additional comments" value={original.additionalComments} />
          <OriginalField label="Media URL" value={original.mediaLink || "(none)"} />
          <OriginalField label="Media Consent" value={original.mediaConsent ? "Yes" : "No"} />
          <hr style={{ borderColor: 'rgba(242, 234, 219, 0.2)', margin: '12px 0' }} />
          <OriginalField label="Book / Story Preference" value={original.bookNote || "(none)"} />
          <OriginalField label="Preferred Attribution" value={original.preferredAttribution ? `${original.attributionPreference === 'custom' ? 'Custom' : original.attributionPreference} — ${original.preferredAttribution}` : original.attributionPreference || "anonymous"} />
          <OriginalField label="Final Notes" value={original.finalNotes || "(none)"} />
          {media.length > 0 && (
            <div>
              <strong style={{ display: 'block', marginBottom: '12px' }}>Attached Media ({media.length})</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {media.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a
                      href={`/admin/media/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        width: '100%',
                        aspectRatio: '1',
                        background: 'var(--bg-soft)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {m.mime_type?.startsWith('image/') ? (
                        <img
                          src={`/admin/media/${m.id}`}
                          alt={m.file_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '12px', color: 'var(--muted)' }}>
                          📄
                        </div>
                      )}
                    </a>
                    <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.file_name}>
                      {m.file_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="micro-note" style={{ fontSize: '11px', textAlign: 'right', color: 'var(--muted)', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(242, 234, 219, 0.2)' }}>ORIGINAL SOURCE — UNEDITED</p>
        </section>

        <form action={saveReview.bind(null, id)} className="panel grid" style={{ background: `linear-gradient(135deg, rgba(184, 155, 255, 0.05) 0%, var(--surface-2) 100%)` }}>
          <h2 style={{ color: 'var(--purple-soft)' }}>Yeriel Review</h2>
          <input type="hidden" name="action" value="saveReview" />
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={submission.status}>
              {submissionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="field"><label>My notes</label><textarea name="notes" defaultValue={review.notes || ""} /></div>
          <div className="field"><label>What I remember</label><textarea name="remembered" defaultValue={review.remembered || ""} /></div>
          <div className="field"><label>Corrections</label><textarea name="corrections" defaultValue={review.corrections || ""} /></div>
          <div className="field"><label>Context</label><textarea name="context" defaultValue={review.context || ""} /></div>
          <div className="field"><label>People</label><input name="people" defaultValue={review.people || ""} /></div>
          <div className="field"><label>Tags</label><input name="tags" defaultValue={review.tags || ""} /></div>
          <div className="grid two">
            <div className="field"><label>Importance</label><input name="importance" type="number" min="1" max="5" defaultValue={review.importance || ""} /></div>
            <div className="field"><label>Emotional significance</label><input name="emotionalSignificance" type="number" min="1" max="5" defaultValue={review.emotional_significance || ""} /></div>
            <div className="field"><label>Historical significance</label><input name="historicalSignificance" type="number" min="1" max="5" defaultValue={review.historical_significance || ""} /></div>
            <div className="field"><label>Accuracy confidence</label><input name="accuracyConfidence" type="number" min="1" max="5" defaultValue={review.accuracy_confidence || ""} /></div>
            <div className="field"><label>Book potential</label><input name="bookPotential" type="number" min="1" max="5" defaultValue={review.book_potential || ""} /></div>
            <div className="field"><label>Chapter / category</label><input name="chapterCategory" defaultValue={review.chapter_category || ""} /></div>
          </div>
          <div className="field"><label>Private notes</label><textarea name="privateNotes" defaultValue={review.private_notes || ""} /></div>
          <div className="actions">
            <button className="btn primary" type="submit">Save review</button>
          </div>
        </form>
      </div>

      {canCreateStory && storyDrafts.length > 0 && (
        <section className="panel grid" style={{ marginTop: "24px", gridColumn: '2 / 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <h2 style={{ margin: '0' }}>Story Draft</h2>
            <span style={{ fontSize: '11px', background: 'rgba(159, 124, 255, 0.2)', color: 'var(--purple-soft)', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>AI-GENERATED</span>
          </div>
          <form action={createStory.bind(null, id)} className="grid">
            <input type="hidden" name="action" value="updateStory" />
            <div className="field">
              <label>Title</label>
              <input name="storyTitle" defaultValue={storyDrafts[0].label} />
            </div>
            <div className="field">
              <label>Draft body</label>
              <textarea name="storyBody" placeholder="Generated narrative, based on original and review..." defaultValue={storyDrafts[0].draft_text} />
            </div>
            <div className="actions">
              <button className="btn primary" type="submit">Update story</button>
            </div>
            <p className="muted">AI-generated narrative. Preserve contributor original and Yeriel review as separate layers.</p>
          </form>
        </section>
      )}

      {canCreateStory && storyDrafts.length === 0 && (
        <section className="panel" style={{ marginTop: "24px", gridColumn: '2 / 3' }}>
          <h2>Story Draft</h2>
          <p className="muted">AI story generation coming soon. Story drafts let you turn memories into narrative.</p>
        </section>
      )}

      {!canCreateStory && (
        <section className="panel" style={{ marginTop: "24px", gridColumn: '2 / 3' }}>
          <h2>Story Draft</h2>
          <p className="muted">Story generation is available after review is marked as REVIEWED or APPROVED_FOR_STORY.</p>
        </section>
      )}
        </div>
      </div>
    </main>
  );
}
