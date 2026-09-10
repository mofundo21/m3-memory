export const dynamic = 'force-dynamic';

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSubmission, upsertReview } from "@/lib/db";
import type { ReviewInput, SubmissionStatus } from "@/lib/types";

const statuses: SubmissionStatus[] = [
  "UNREVIEWED",
  "IN_REVIEW",
  "REVIEWED",
  "APPROVED_FOR_STORY",
  "REJECTED",
  "ARCHIVED"
];

async function saveReview(id: string, formData: FormData) {
  "use server";
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
  upsertReview(id, input);
  redirect(`/admin/submissions/${id}`);
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const submission = getSubmission(id) as any;
  if (!submission) notFound();
  const original = submission.original;
  const review = submission.review || {};

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <strong>Submission Detail</strong>
          <span>{submission.id}</span>
        </div>
        <Link className="btn" href="/admin">Back to inbox</Link>
      </header>

      <div className="split">
        <section className="panel stack">
          <h2>Original Submission</h2>
          <p className="notice">Preserved exactly as submitted. Do not edit this layer.</p>
          {Object.entries(original).map(([key, value]) => (
            <div key={key}>
              <strong>{key}</strong>
              <p className="muted">{String(value || "-")}</p>
            </div>
          ))}
        </section>

        <form action={saveReview.bind(null, id)} className="panel grid">
          <h2>Yeriel's Review</h2>
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={submission.status}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
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
            <div className="field"><label>Accuracy / confidence</label><input name="accuracyConfidence" type="number" min="1" max="5" defaultValue={review.accuracy_confidence || ""} /></div>
            <div className="field"><label>Book potential</label><input name="bookPotential" type="number" min="1" max="5" defaultValue={review.book_potential || ""} /></div>
            <div className="field"><label>Chapter / category</label><input name="chapterCategory" defaultValue={review.chapter_category || ""} /></div>
          </div>
          <div className="field"><label>Private notes</label><textarea name="privateNotes" defaultValue={review.private_notes || ""} /></div>
          <div className="actions">
            <button className="btn primary" type="submit">Save review</button>
            <button className="btn" type="button" disabled>Create story</button>
          </div>
          <p className="muted">Story generation is intentionally disabled until reviewed material and writing rules are ready.</p>
        </form>
      </div>
    </main>
  );
}

