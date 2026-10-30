import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { updateSubmission } from "../../actions";
import { AdminNav } from "@/components/admin-nav";
import { relationshipDuration } from "@/lib/relationship-duration";

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
      "*,persons(*),encounters(*),consent_grants(*),submission_flags(*),reviews(*),media(*),submission_tags(tags(*)),book_desk_entries(*),follow_ups(*)",
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
  const bookEntry = submission.book_desk_entries?.[0];
  const followUp = submission.follow_ups?.[0];
  const selectedTagIds = new Set((submission.submission_tags || []).map((link: {tags:{id:string}|{id:string}[]}) => Array.isArray(link.tags) ? link.tags[0]?.id : link.tags?.id).filter(Boolean));
  const { data: allTags } = await db.from("tags").select("id,name").order("name");
  const original = submission.original_json || {};
  const duration = relationshipDuration({ occurredOn: encounter?.occurred_on, approximateDateText: encounter?.approximate_date_text || submission.encounter_date, certainty: encounter?.date_certainty || (submission.is_approximate_date ? "approximate" : submission.encounter_date ? "exact" : "unknown") });
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
    ["Definitely the first meeting?", encounter?.definitely_first_meeting || original.definitelyFirstMeeting],
    ["Time of day", encounter?.time_of_day || original.timeOfDay],
    ["Where exactly", encounter?.exact_place || original.exactPlace],
    ["Who they were with", encounter?.contributor_with || original.contributorWith],
    ["Who MOFUNDO was with", encounter?.mofundo_with || original.mofundoWith],
    ["Introduced by", encounter?.introduced_by || original.introducedBy],
    ["What was happening around them", encounter?.surroundings || original.surroundings],
    ["Immediately before", encounter?.immediately_before || original.immediatelyBefore],
    ["Time together", encounter?.time_together || original.timeTogether],
    ["MOFUNDO's hair, style, or look", encounter?.mofundo_hair_style || original.mofundoHairStyle],
    ["What MOFUNDO carried", encounter?.mofundo_carrying || original.mofundoCarrying],
    ["What they carried", encounter?.contributor_carrying || original.contributorCarrying],
    ["Music playing", encounter?.music_playing || original.musicPlaying],
    ["DJ, artist, or set", encounter?.artist_or_set || original.artistOrSet],
    ["What the place looked like", encounter?.place_appearance || original.placeAppearance],
    ["Distinctive detail nearby", encounter?.distinctive_nearby || original.distinctiveNearby],
    ["What they heard", encounter?.remembered_hearing || original.rememberedHearing],
    ["What they saw", encounter?.remembered_seeing || original.rememberedSeeing],
    ["MOFUNDO's exact words", encounter?.mofundo_exact_words || original.mofundoExactWords],
    ["Their exact words", encounter?.contributor_exact_words || original.contributorExactWords],
    ["Remembered quote or joke", encounter?.remembered_quote_or_joke || original.rememberedQuoteOrJoke],
    ["Before talking", encounter?.impression_before_talking || original.impressionBeforeTalking],
    ["After talking", encounter?.impression_after_talking || original.impressionAfterTalking],
    ["Seen since", encounter?.seen_since || original.seenSince],
    ["Next encounter", original.nextSeenStory || encounter?.next_seen_where || original.nextSeenWhere],
    ["Connection today", original.connectionToday || person?.relationship_today],
    ["Smallest remembered detail", encounter?.smallest_detail || original.smallestDetail],
    ["Never told before", encounter?.never_told_detail || original.neverToldDetail],
    ["A different recollection", encounter?.differing_memory || original.differingMemory],
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
      <AdminNav active="Submissions" />
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
      <section className="archive-summary"><div><span>Archive ID</span><strong>{submission.reference_code}</strong></div><div><span>First encounter</span><strong>{encounter?.occurred_on || encounter?.approximate_date_text || submission.encounter_date || "Unknown"}</strong></div><div><span>Relationship</span><strong>{duration.label}</strong></div><div><span>Event</span><strong>{submission.event_name || encounter?.submitted_event_name || "Not provided"}</strong></div><div><span>Location</span><strong>{[submission.location_name,submission.city].filter(Boolean).join(", ") || "Not provided"}</strong></div><div><span>Evidence</span><strong>{media.length} file{media.length===1?"":"s"}</strong></div><div><span>Book</span><strong>{flags?.book_potential?"Potential":"Not flagged"}</strong></div><div><span>Verification</span><strong>{flags?.needs_verification?"Needed":"No flag"}</strong></div></section>
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
            <input type="hidden" name="encounterId" value={encounter?.id || ""} />
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
            <label>Book Desk category<select name="bookCategory" defaultValue={bookEntry?.category || "Unsorted"}>{["Unsorted","Strong Stories","Strong Quotes","Stories I Forgot","Needs Interview","Needs Verification","Photo Evidence","Early History","Festival Stories","Major Turning Points"].map((item)=><option key={item}>{item}</option>)}</select></label>
            <label>Book notes<textarea name="bookNotes" defaultValue={bookEntry?.notes || ""} /></label>
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
            <label>Follow-up status<select name="followUpStatus" defaultValue={followUp?.status || "Needed"}>{["Needed","Contacted","Waiting","Completed","Unable to contact"].map((item)=><option key={item}>{item}</option>)}</select></label>
            <label>Why follow-up is needed<textarea name="followUpReason" defaultValue={followUp?.reason || ""} /></label>
            <fieldset className="tag-fieldset"><legend>Archive tags</legend><div className="tag-options">{allTags?.map((tag)=><label className="tag-option" key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={selectedTagIds.has(tag.id)} />{tag.name}</label>)}</div><input name="customTag" placeholder="Add a custom tag" /></fieldset>
            <details className="verification-editor"><summary>Verified archive facts</summary><label>Verified date<input name="verifiedDate" type="date" defaultValue={encounter?.verified_occurred_on || ""}/></label><label>Verified event<input name="verifiedEvent" defaultValue={encounter?.verified_event_name || ""}/></label><label>Verified venue<input name="verifiedVenue" defaultValue={encounter?.verified_venue || ""}/></label><label>Verified city<input name="verifiedCity" defaultValue={encounter?.verified_city || ""}/></label><label>Verification source<input name="verificationSource" defaultValue={encounter?.verification_source || ""}/></label><label>Confidence (0–100)<input name="verificationConfidence" type="number" min="0" max="100" defaultValue={encounter?.verification_confidence || ""}/></label><label>Verification notes<textarea name="verificationNotes" defaultValue={encounter?.verification_notes || ""}/></label></details>
            <button className="admin-primary">Save review</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
