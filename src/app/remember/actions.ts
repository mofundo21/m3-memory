"use server";

import { updateSubmissionPreferences } from "@/lib/db";
import { redirect } from "next/navigation";

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
