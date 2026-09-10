export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { createSubmission } from "@/lib/db";
import type { SubmissionInput } from "@/lib/types";

async function submitMemory(formData: FormData) {
  "use server";

  const input: SubmissionInput = {
    submitterName: String(formData.get("submitterName") || ""),
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
    additionalComments: String(formData.get("additionalComments") || "")
  };

  if (!input.submitterName.trim() || !input.memoryText.trim()) {
    redirect("/submit?error=missing");
  }

  createSubmission(input);
  redirect("/submit/thanks");
}

export default function SubmitPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <strong>M3 Memory</strong>
          <span>Public submission</span>
        </div>
      </header>

      <form action={submitMemory} className="panel grid">
        <div className="grid two">
          <div className="field">
            <label>Name</label>
            <input name="submitterName" required />
          </div>
          <div className="field">
            <label>Contact or social, optional</label>
            <input name="contact" />
          </div>
        </div>

        <div className="grid two">
          <div className="field">
            <label>Encounter date</label>
            <input name="encounterDate" type="date" />
          </div>
          <label className="field">
            <span>Approximate date</span>
            <input name="isApproximateDate" type="checkbox" />
          </label>
        </div>

        <div className="grid two">
          <div className="field"><label>Location</label><input name="locationName" /></div>
          <div className="field"><label>Festival / event</label><input name="eventName" /></div>
          <div className="field"><label>City</label><input name="city" /></div>
          <div className="field"><label>State / region</label><input name="region" /></div>
          <div className="field"><label>Country</label><input name="country" /></div>
        </div>

        <div className="field">
          <label>How did you meet Yeriel / MOFUNDO?</label>
          <textarea name="howMet" />
        </div>
        <div className="field">
          <label>What do you remember?</label>
          <textarea name="memoryText" required />
        </div>
        <div className="field"><label>What happened before?</label><textarea name="beforeText" /></div>
        <div className="field"><label>What happened afterward?</label><textarea name="afterText" /></div>
        <div className="field"><label>Did you meet again?</label><textarea name="metAgain" /></div>
        <div className="field"><label>Who else was present?</label><textarea name="peoplePresent" /></div>
        <div className="field"><label>What was Yeriel / MOFUNDO wearing?</label><textarea name="yerielWearing" /></div>
        <div className="field"><label>What were you wearing?</label><textarea name="submitterWearing" /></div>
        <div className="field"><label>What did you talk about?</label><textarea name="talkedAbout" /></div>
        <div className="field"><label>Was anything exchanged?</label><textarea name="exchanged" /></div>
        <div className="field"><label>Artifacts, objects, tickets, merch, or keepsakes</label><textarea name="artifactInfo" /></div>
        <div className="field"><label>What do you think I don't remember about this day?</label><textarea name="forgottenPrompt" /></div>
        <div className="field"><label>If this moment were a page in a book, what would you want the page to say?</label><textarea name="bookPagePrompt" /></div>
        <div className="field"><label>Additional comments</label><textarea name="additionalComments" /></div>

        <div className="notice">Photo, video, and audio uploads are intentionally postponed until storage is configured.</div>
        <button className="btn primary" type="submit">Submit memory</button>
      </form>
    </main>
  );
}

