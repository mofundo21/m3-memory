import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { submissionSchema } from "@/lib/submission-schema";
import { createHash, randomBytes } from "node:crypto";

const POLICY_VERSION = "2026-10-29-v1";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please check the form.", issues: parsed.error.flatten() }, { status: 422 });

  const db = createSupabaseAdmin();
  let createdPersonId: string | null = null;
  let createdSubmissionId: string | null = null;

  try {
    const input = parsed.data;
    const uploadToken = randomBytes(32).toString("hex");
    const uploadTokenHash = createHash("sha256").update(uploadToken).digest("hex");
    const { data: person, error: personError } = await db.from("persons").insert({ display_name: input.displayName, contact: input.email, email: input.email, instagram: input.instagram || null, known_as_at_first_meeting: input.knownAsAtTime || null, living_location_at_first_meeting: input.livingAtTime || null, relationship_today: input.relationshipToday || null, relationship_today_other: input.relationshipTodayOther || null }).select("id").single();
    if (personError) throw personError;
    createdPersonId = person.id;

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
      upload_token_hash: uploadTokenHash,
      upload_token_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    }).select("id, reference_code").single();
    if (submissionError) throw submissionError;
    createdSubmissionId = submission.id;

    const { data: encounter, error: encounterError } = await db.from("encounters").insert({
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
      person_id: person.id,
      definitely_first_meeting: input.definitelyFirstMeeting || null, time_of_day: input.timeOfDay || null,
      exact_place: input.exactPlace || null, contributor_with: input.contributorWith || null,
      mofundo_with: input.mofundoWith || null, introduced_by: input.introducedBy || null,
      surroundings: input.surroundings || null, immediately_before: input.immediatelyBefore || null,
      time_together: input.timeTogether || null, mofundo_hair_style: input.mofundoHairStyle || null,
      mofundo_carrying: input.mofundoCarrying || null, contributor_carrying: input.contributorCarrying || null,
      music_playing: input.musicPlaying || null, artist_or_set: input.artistOrSet || null,
      place_appearance: input.placeAppearance || null, distinctive_nearby: input.distinctiveNearby || null,
      remembered_hearing: input.rememberedHearing || null, remembered_seeing: input.rememberedSeeing || null,
      mofundo_exact_words: input.mofundoExactWords || null, contributor_exact_words: input.contributorExactWords || null,
      mofundo_work_discussed: input.mofundoWorkDiscussed || null, talked_about_music: input.talkedAboutMusic || null,
      talked_about_personal: input.talkedAboutPersonal || null, story_told: input.storyTold || null,
      remembered_quote_or_joke: input.rememberedQuoteOrJoke || null,
      impression_before_talking: input.impressionBeforeTalking || null, impression_after_talking: input.impressionAfterTalking || null,
      kept_hanging_out: input.keptHangingOut || null, exchanged_contact: input.exchangedContact || null,
      contacted_afterward: input.contactedAfterward || null, told_anyone: input.toldAnyone || null,
      told_anyone_details: input.toldAnyoneDetails || null, expected_to_meet_again: input.expectedToMeetAgain || null,
      seen_since: input.seenSince || null, next_seen_where: input.nextSeenWhere || null,
      next_seen_when: input.nextSeenWhen || null, next_seen_story: input.nextEncounterStory || null,
      approximate_meeting_count: input.meetingCount || null, connection_today: input.connectionToday || null,
      life_impact: input.lifeEffect || null, watched_change: input.watchedChange || null,
      change_details: input.changeObserved || null,
      first_known_identity: input.firstKnownIdentity || null, knew_music_at_time: input.knewMusicAtTime || null,
      knew_book_at_time: input.knewBookAtTime || null, smallest_detail: input.smallestDetail || null,
      never_told_detail: input.neverToldDetail || null, differing_memory: input.differingMemory || null,
    }).select("id").single();
    if (encounterError) throw encounterError;
    const { error: participantError } = await db.from("encounter_participants").upsert({ encounter_id: encounter.id, person_id: person.id, role: "contributor" });
    if (participantError) throw participantError;

    const consents = [
      ["archive_storage", true], ["public_website", input.publicWebsite], ["book_editorial", input.bookEditorial],
      ["display_name", input.displayPublicName], ["display_social", input.displaySocial], ["follow_up_contact", input.followUpContact],
    ].map(([kind, granted]) => ({ submission_id: submission.id, kind, granted, policy_version: POLICY_VERSION }));
    const { error: consentError } = await db.from("consent_grants").insert(consents);
    if (consentError) throw consentError;
    const { error: flagError } = await db.from("submission_flags").insert({ submission_id: submission.id });
    if (flagError) throw flagError;
    return NextResponse.json({ referenceCode: submission.reference_code, uploadToken }, { status: 201 });
  } catch (error) {
    console.error("Submission creation failed", error);
    if (createdSubmissionId) {
      const { error: cleanupError } = await db.from("submissions").delete().eq("id", createdSubmissionId);
      if (cleanupError) console.error("Failed to clean up partial submission", cleanupError);
    }
    if (createdPersonId) {
      const { error: cleanupError } = await db.from("persons").delete().eq("id", createdPersonId);
      if (cleanupError) console.error("Failed to clean up partial person", cleanupError);
    }
    return NextResponse.json({ error: "The memory could not be saved. Please try again." }, { status: 500 });
  }
}
