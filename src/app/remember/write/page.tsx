export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSubmission, insertMediaRows, validateMediaUpload } from "@/lib/db";
import { uploadSupabaseMedia, getPersistenceMode } from "@/lib/supabase";
import type { SubmissionInput } from "@/lib/types";
import { MediaPicker } from "../MediaPicker";

async function submitMemory(formData: FormData) {
  "use server";

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

  // Create submission row (with media upload in this step)
  const submissionId = await createSubmission(input);

  // Handle media upload (files live only in component state, uploaded here)
  const mediaFiles = formData.getAll("media") as File[];
  if (mediaFiles.length > 0) {
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
      redirect(`/remember/write?error=media`);
    }
  }

  // Success: redirect to Act III with submission ID in session
  redirect(`/remember/final?submissionId=${submissionId}`);
}

export const metadata = {
  title: "Your Memory | M3 Memory",
  description: "Tell us your memory."
};

export default async function WriteMemoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Your Memory</h1>
          <p className="text-lg text-slate-600">Tell us about the person you remember. Your words, your version, kept safely.</p>
        </div>

        <form action={submitMemory} method="POST" className="space-y-12">
          {/* Identity Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">Who Are You?</legend>
            <div>
              <label htmlFor="submitterName" className="block text-sm font-medium text-slate-700 mb-2">
                Your name (optional — leave blank to share as Anonymous)
              </label>
              <input
                type="text"
                id="submitterName"
                name="submitterName"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Mikey, River, Your Name"
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-slate-700 mb-2">
                Your email (optional)
              </label>
              <input
                type="email"
                id="contact"
                name="contact"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </fieldset>

          {/* The Memory Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">The Memory</legend>
            <div>
              <label htmlFor="memoryText" className="block text-sm font-medium text-slate-700 mb-2">
                What do you remember? *
              </label>
              <textarea
                id="memoryText"
                name="memoryText"
                required
                rows={8}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe what you remember about this encounter. What happened? What did they say? What struck you?"
              />
            </div>
          </fieldset>

          {/* Place It Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">Place It</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="encounterDate" className="block text-sm font-medium text-slate-700 mb-2">
                  When did you meet? (optional)
                </label>
                <input
                  type="date"
                  id="encounterDate"
                  name="encounterDate"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="isApproximateDate" className="flex items-center mt-8">
                  <input type="checkbox" id="isApproximateDate" name="isApproximateDate" className="rounded" />
                  <span className="ml-2 text-sm text-slate-700">Approximate date</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="locationName" className="block text-sm font-medium text-slate-700 mb-2">
                  Location name (optional)
                </label>
                <input
                  type="text"
                  id="locationName"
                  name="locationName"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g. Coffee shop, Festival, Friend's house"
                />
              </div>
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-2">
                  Event name (optional)
                </label>
                <input
                  type="text"
                  id="eventName"
                  name="eventName"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g. Lantern Night, Summer Festival"
                />
              </div>
            </div>
          </fieldset>

          {/* Bring It Back (Media) Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">Bring It Back</legend>
            <MediaPicker />
          </fieldset>

          {/* Progressive Disclosure: The Details */}
          <details className="group">
            <summary className="cursor-pointer font-semibold text-slate-900 text-lg hover:text-indigo-600">
              + Add more details
            </summary>

            <fieldset className="space-y-6 mt-6 border-t border-slate-200 pt-8">
              <div>
                <label htmlFor="howMet" className="block text-sm font-medium text-slate-700 mb-2">
                  How did you meet? (optional)
                </label>
                <textarea
                  id="howMet"
                  name="howMet"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="beforeText" className="block text-sm font-medium text-slate-700 mb-2">
                  What was happening before you met? (optional)
                </label>
                <textarea
                  id="beforeText"
                  name="beforeText"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="afterText" className="block text-sm font-medium text-slate-700 mb-2">
                  What happened after? (optional)
                </label>
                <textarea
                  id="afterText"
                  name="afterText"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="metAgain" className="block text-sm font-medium text-slate-700 mb-2">
                  Did you meet again? (optional)
                </label>
                <textarea
                  id="metAgain"
                  name="metAgain"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="peoplePresent" className="block text-sm font-medium text-slate-700 mb-2">
                  Who else was there? (optional)
                </label>
                <textarea
                  id="peoplePresent"
                  name="peoplePresent"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="talkedAbout" className="block text-sm font-medium text-slate-700 mb-2">
                  What did you talk about? (optional)
                </label>
                <textarea
                  id="talkedAbout"
                  name="talkedAbout"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="exchanged" className="block text-sm font-medium text-slate-700 mb-2">
                  Did you exchange anything? (optional)
                </label>
                <textarea
                  id="exchanged"
                  name="exchanged"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="additionalComments" className="block text-sm font-medium text-slate-700 mb-2">
                  Anything else to add? (optional)
                </label>
                <textarea
                  id="additionalComments"
                  name="additionalComments"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </fieldset>
          </details>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Continue to Final Review →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
