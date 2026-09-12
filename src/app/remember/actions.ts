"use server";

import { updateSubmissionPreferences, createSubmission, insertMediaRows, validateMediaUpload } from "@/lib/db";
import { uploadSupabaseMedia, getPersistenceMode } from "@/lib/supabase";
import type { SubmissionInput } from "@/lib/types";
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

  const submissionId = await createSubmission(input);

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
  try {
    await updateSubmissionPreferences(submissionId, {
      attributionPreference: formData.attributionPreference,
      preferredAttribution: formData.preferredAttribution,
      bookNote: formData.bookNote,
      finalNotes: formData.finalNotes
    });

    redirect("/thanks");
  } catch (error: any) {
    throw new Error(`Failed to save preferences: ${error.message}`);
  }
}
