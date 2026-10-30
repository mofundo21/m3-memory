import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { updateSubmission } from "../../actions";

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createSupabaseAdmin();
  const { data: submission } = await db
    .from("submissions")
    .select(
      "*,persons(*),encounters(*),consent_grants(*),submission_flags(*),reviews(*),media(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!submission) notFound();
  const person = Array.isArray(submission.persons)
    ? submission.persons[0]
    : submission.persons;
  const encounter = submission.encounters?.[0];
  const flags = Array.isArray(submission.submission_flags)
    ? submission.submission_flags[0]
    : submission.submission_flags;
  const review = submission.reviews?.[0];
  const original = submission.original_json || {};
  const media = await Promise.all(
    (submission.media || []).map(
      async (item: {
        id: string;
        file_name: string;
        mime_type: string;
        storage_path: string;
        size_bytes: number;
      }) => {
        const { data } = await db.storage
          .from("memory-evidence")
          .createSignedUrl(item.storage_path, 600);
        return { ...item, url: data?.signedUrl || null };
      },
    ),
  );
  const fields = [
    [
      "How we met",
      encounter?.story || original.story || submission.memory_preview,
    ],
    [
      "What we talked about",
      encounter?.conversation_details || original.conversationDetails,
    ],
    [
      "What MOFUNDO was wearing",
      encounter?.mofundo_wearing || original.mofundoWearing,
    ],
    [
      "What they were wearing",
      encounter?.contributor_wearing || original.contributorWearing,
    ],
    [
      "First impression",
      encounter?.first_impression || original.firstImpression,
    ],
    [
      "Funny or meaningful details",
      encounter?.meaningful_details || original.meaningfulDetails,
    ],
    [
      "Things exchanged",
      encounter?.things_exchanged || original.thingsExchanged,
    ],
    [
      "What I may not remember",
      encounter?.forgotten_detail || original.forgottenDetail,
    ],
    [
      "The page in the book",
      encounter?.book_page_message || original.bookPageMessage,
    ],
  ].filter(([, value]) => text(value));
  const evidenceBlock = media.length ? (
    <section className="evidence-section">
      <h3>Evidence files</h3>
      <div className="evidence-grid">
        {media.map((item) => (
          <a
            className="evidence-item"
            href={item.url || "#"}
            target="_blank"
            rel="noreferrer"
            key={item.id}
          >
            {item.mime_type.startsWith("image/") && item.url ? (
              <img src={item.url} alt={item.file_name} />
            ) : (
              <span className="file-icon">
                {item.mime_type.startsWith("video/")
                  ? "VIDEO"
                  : item.mime_type.startsWith("audio/")
                    ? "AUDIO"
                    : "FILE"}
              </span>
            )}
            <strong>{item.file_name}</strong>
            <small>{(item.size_bytes / 1024 / 1024).toFixed(1)} MB</small>
          </a>
        ))}
      </div>
    </section>
  ) : null;
  return (
    <main className="admin-shell">
      <Link className="back-link" href="/admin">
        ← Back to inbox
      </Link>
      <header className="admin-top">
        <div>
          <div className="admin-brand">{submission.reference_code}</div>
          <h1>{person?.display_name || "Unknown contributor"}</h1>
          <p>{person?.email || person?.contact}</p>
        </div>
        <span className="status-pill">{submission.status}</span>
      </header>
      <div className="review-layout">
        <section className="admin-card memory-detail">
          <h2>Memory</h2>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>
                {encounter?.occurred_on ||
                  encounter?.approximate_date_text ||
                  submission.encounter_date ||
                  "Unknown"}
              </dd>
            </div>
            <div>
              <dt>Place</dt>
              <dd>
                {[
                  submission.location_name,
                  submission.city,
                  submission.region,
                  submission.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "Not provided"}
              </dd>
            </div>
            <div>
              <dt>Event</dt>
              <dd>{submission.event_name || "Not provided"}</dd>
            </div>
          </dl>
          {fields.map(([label, value]) => (
            <article key={label as string}>
              <h3>{label as string}</h3>
              <p>{value as string}</p>
            </article>
          ))}
          {evidenceBlock}
          <h3>Permissions</h3>
          <ul>
            {submission.consent_grants?.map(
              (consent: { id: string; kind: string; granted: boolean }) => (
                <li key={consent.id}>
                  {consent.kind.replaceAll("_", " ")}:{" "}
                  <strong>{consent.granted ? "Yes" : "No"}</strong>
                </li>
              ),
            )}
          </ul>
        </section>
        <aside className="admin-card review-panel">
          <h2>Review</h2>
          <form action={updateSubmission}>
            <input type="hidden" name="submissionId" value={id} />
            <label>
              Status
              <select name="status" defaultValue={submission.status}>
                {[
                  "UNREVIEWED",
                  "IN_REVIEW",
                  "NEEDS_FOLLOW_UP",
                  "APPROVED",
                  "ARCHIVED",
                  "REJECTED",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Private notes
              <textarea
                name="privateNotes"
                defaultValue={review?.private_notes || ""}
              />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                name="bookPotential"
                defaultChecked={flags?.book_potential}
              />{" "}
              Book potential
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                name="sensitive"
                defaultChecked={flags?.sensitive}
              />{" "}
              Sensitive
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                name="needsVerification"
                defaultChecked={flags?.needs_verification}
              />{" "}
              Needs verification
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                name="needsFollowUp"
                defaultChecked={flags?.needs_follow_up}
              />{" "}
              Needs follow-up
            </label>
            <button className="admin-primary">Save review</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
