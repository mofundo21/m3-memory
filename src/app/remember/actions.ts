"use server";

import {
  deleteSubmissionRecords,
  insertMediaRows,
  normalizeSubmissionRecord,
  persistNormalizedSubmission,
  validateMediaUpload
} from "@/lib/db";
import { uploadSupabaseMedia, getPersistenceMode } from "@/lib/supabase";
import {
  CONTRIBUTOR_ERROR_MESSAGE,
  cookieNameFor,
  cookieOptions,
  formatCookieValue,
  isCanonicalSubmissionId,
  issueCapability,
  logContributorEvent,
  redeemCapability,
  sanitizePreferences
} from "@/lib/contributorCapability";
import type { SubmissionInput } from "@/lib/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function submitMemoryAction(formData: FormData) {
  const input: SubmissionInput = {
    submitterName: String(formData.get("submitterName") || "").trim() || "Anonymous",
    contact: String(formData.get("contact") || ""),
    encounterDate: String(formData.get("encounterDate") || ""),
    isApproximateDate: formData.get("isApproximateDate") === "on",
    locationName: String(formData.get("locationName") || ""),
    city: String(formData.get("city") || ""),
    region: String(formData.get("region") || ""),
    country: String(formData.get("country") || ""),
    eventName: String(formData.get("eventName") || ""),
    howMet: String(formData.get("howMet") || ""),
    memoryText: String(formData.get("memoryText") || ""),
    beforeText: String(formData.get("beforeText") || ""),
    afterText: String(formData.get("afterText") || ""),
    metAgain: String(formData.get("metAgain") || ""),
    peoplePresent: String(formData.get("peoplePresent") || ""),
    yerielWearing: String(formData.get("yerielWearing") || ""),
    submitterWearing: String(formData.get("submitterWearing") || ""),
    talkedAbout: String(formData.get("talkedAbout") || ""),
    exchanged: String(formData.get("exchanged") || ""),
    artifactInfo: String(formData.get("artifactInfo") || ""),
    forgottenPrompt: String(formData.get("forgottenPrompt") || ""),
    bookPagePrompt: String(formData.get("bookPagePrompt") || ""),
    additionalComments: String(formData.get("additionalComments") || ""),
    mediaLink: String(formData.get("mediaLink") || ""),
    mediaConsent: formData.get("mediaConsent") === "on"
  };

  if (!input.memoryText.trim()) {
    redirect("/remember/write?error=missing");
  }

  // Normalize once. The SID and person id are server-generated here and never taken from the client.
  // Order (design v3): capability row first, then the submission, both keyed by the same SID. Any failure
  // removes whatever was created, using the ids already in hand, and returns one fixed redirect.
  let record: ReturnType<typeof normalizeSubmissionRecord>;
  try {
    record = normalizeSubmissionRecord(input);
  } catch {
    logContributorEvent("issue-failed");
    redirect("/remember/details?error=save");
  }
  const submissionId = record.id;
  const personId = record.personId;

  let capabilityToken: string;
  try {
    capabilityToken = await issueCapability(submissionId, new Date());
    await persistNormalizedSubmission(record);
  } catch {
    logContributorEvent("issue-failed");
    try {
      await deleteSubmissionRecords(submissionId, personId);
    } catch {
      logContributorEvent("compensation-failed");
    }
    redirect("/remember/details?error=save");
  }
  const jar = await cookies();
  jar.set(cookieNameFor(submissionId), formatCookieValue(submissionId, capabilityToken), cookieOptions());

  const mediaFiles = formData.getAll("media") as File[];
  if (mediaFiles.length > 0 && getPersistenceMode() === "supabase") {
    try {
      const validationInputs = await Promise.all(
        mediaFiles.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size
        }))
      );

      validateMediaUpload(validationInputs);

      const uploadedMedia = await Promise.all(
        mediaFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const storagePath = await uploadSupabaseMedia(
            submissionId,
            file.name,
            new Uint8Array(buffer),
            file.type
          );

          return {
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            storagePath
          };
        })
      );

      await insertMediaRows(submissionId, uploadedMedia);
    } catch (error: any) {
      console.error("Media upload error:", error);
      redirect(`/remember/details?error=media`);
    }
  }

  redirect(`/remember/final?submissionId=${submissionId}`);
}

export async function updatePreferencesAction(submissionId: string, formData: any) {
  // The submission id argument is untrusted. It only selects which cookie to read, and the redeem step
  // requires the cookie's own id to match it. Every database predicate uses the cookie's id.
  const jar = await cookies();
  const name = isCanonicalSubmissionId(submissionId) ? cookieNameFor(submissionId) : null;
  const value = name ? jar.get(name)?.value : undefined;

  let saved = false;
  try {
    saved = await redeemCapability(submissionId, value, sanitizePreferences(formData ?? {}), new Date());
  } catch {
    logContributorEvent("backend-error");
    saved = false;
  }

  // The capability is spent whether or not the save succeeded. Clear the cookie in every case.
  if (name) jar.set(name, "", cookieOptions(0));

  if (!saved) {
    throw new Error(CONTRIBUTOR_ERROR_MESSAGE);
  }

  // redirect() throws; it must sit outside the try block or the catch turns it into an error.
  redirect("/thanks");
}
