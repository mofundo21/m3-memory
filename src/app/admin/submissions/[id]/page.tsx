export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAdminAuthMode, requireAdmin } from "@/lib/auth";
import { getSubmission, upsertReview, createStoryDraft, getStoryDrafts } from "@/lib/db";
import { submissionStatuses, type ReviewInput, type SubmissionStatus } from "@/lib/types";

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

  const canCreateStory = submission.status === "REVIEWED" || submission.status === "APPROVED_FOR_STORY";

  return (
    <main className="shell admin-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Submission detail</strong>
          <span>{submission.id}</span>
        </div>
        <Link className="btn" href="/admin/submissions">Back to inbox</Link>
      </header>

      <div className="split">
        <section className="panel stack">
          <div>
            <h2>Contributor Original</h2>
            <p className="notice">Immutable source layer. Review notes and corrections belong on the right.</p>
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
        </section>

        <form action={saveReview.bind(null, id)} className="panel grid">
          <h2>Yeriel Review</h2>
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

      {canCreateStory && (
        <section className="panel grid" style={{ marginTop: "24px" }}>
          <h2>Story Draft</h2>
          <form action={createStory.bind(null, id)} className="grid">
            <div className="field">
              <label>Title</label>
              <input name="storyTitle" defaultValue={storyDrafts[0]?.label || "AI-GENERATED DRAFT"} />
            </div>
            <div className="field">
              <label>Draft body</label>
              <textarea name="storyBody" placeholder="Generated narrative, based on original and review..." defaultValue={storyDrafts[0]?.draft_text || ""} />
            </div>
            <div className="actions">
              <button className="btn primary" type="submit">{storyDrafts[0] ? "Update story" : "Create story"}</button>
            </div>
            <p className="muted">AI-generated narrative. Preserve contributor original and Yeriel review as separate layers.</p>
          </form>
        </section>
      )}

      {!canCreateStory && (
        <section className="panel" style={{ marginTop: "24px" }}>
          <h2>Story Draft</h2>
          <p className="muted">Story generation is available after review is marked as REVIEWED or APPROVED_FOR_STORY.</p>
        </section>
      )}
    </main>
  );
}
