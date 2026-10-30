import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { submissionSchema } from "@/lib/submission-schema";

const POLICY_VERSION = "2026-10-29-v1";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please check the form.", issues: parsed.error.flatten() }, { status: 422 });

  try {
    const input = parsed.data;
    const db = createSupabaseAdmin();
    const { data: person, error: personError } = await db.from("persons").insert({ display_name: input.displayName, contact: input.email, email: input.email, instagram: input.instagram || null }).select("id").single();
    if (personError) throw personError;

    const { data: submission, error: submissionError } = await db.from("submissions").insert({
      submitter_person_id: person.id,
      status: "UNREVIEWED",
      policy_version: POLICY_VERSION,
      submitted_at: new Date().toISOString(),
      original_json: input,
      memory_preview: input.story.slice(0, 500),
      encounter_date: input.dateCertainty === "exact" ? input.occurredOn : input.dateCertainty === "approximate" ? input.approximateDateText : null,
      is_approximate_date: input.dateCertainty === "approximate",
      location_name: input.venue || null,
      city: input.city || null,
      region: input.region || null,
      country: input.country || null,
      event_name: input.eventName || null,
    }).select("id, reference_code").single();
    if (submissionError) throw submissionError;

    const { error: encounterError } = await db.from("encounters").insert({
      submission_id: submission.id, kind: "first_meeting", sequence_number: 1,
      date_certainty: input.dateCertainty, occurred_on: input.dateCertainty === "exact" ? input.occurredOn : null,
      approximate_date_text: input.dateCertainty === "approximate" ? input.approximateDateText : null,
      submitted_event_name: input.eventName || null, submitted_venue: input.venue || null,
      submitted_city: input.city || null, submitted_region: input.region || null, submitted_country: input.country || null,
      story: input.story, conversation_details: input.conversationDetails || null,
      mofundo_wearing: input.mofundoWearing || null, contributor_wearing: input.contributorWearing || null,
      first_impression: input.firstImpression || null, meaningful_details: input.meaningfulDetails || null,
      things_exchanged: input.thingsExchanged || null, forgotten_detail: input.forgottenDetail || null,
      book_page_message: input.bookPageMessage || null,
    });
    if (encounterError) throw encounterError;

    const consents = [
      ["archive_storage", true], ["public_website", input.publicWebsite], ["book_editorial", input.bookEditorial],
      ["display_name", input.displayPublicName], ["display_social", input.displaySocial], ["follow_up_contact", input.followUpContact],
    ].map(([kind, granted]) => ({ submission_id: submission.id, kind, granted, policy_version: POLICY_VERSION }));
    const { error: consentError } = await db.from("consent_grants").insert(consents);
    if (consentError) throw consentError;
    await db.from("submission_flags").insert({ submission_id: submission.id });
    return NextResponse.json({ referenceCode: submission.reference_code }, { status: 201 });
  } catch (error) {
    console.error("Submission creation failed", error);
    return NextResponse.json({ error: "The memory could not be saved. Please try again." }, { status: 500 });
  }
}
