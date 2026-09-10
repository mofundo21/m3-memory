export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSubmission } from "@/lib/db";
import type { SubmissionInput } from "@/lib/types";
import { SubmitMemoryButton } from "./SubmitMemoryButton";

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
    redirect("/remember?error=missing");
  }

  createSubmission(input);
  redirect("/thanks");
}

export default async function RememberPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasError = params?.error === "missing";

  return (
    <main className="memory-shell">
      <header className="memory-header">
        <a className="wordmark" href="/">M3 Memory</a>
        <span>for Yeriel / MOFUNDO</span>
      </header>

      <form action={submitMemory} className="memory-card memory-form">
        <div className="intro">
          <p className="kicker">Private archive</p>
          <h1>Tell me the part only you remember.</h1>
          <p>
            Write it like you are sending me a voice note. The original stays private and untouched while I review it later.
          </p>
        </div>

        <div className="progress-line"><span /></div>
        {hasError ? <p className="error-note">Please add your name and the memory before sending.</p> : null}

        <div className="field">
          <label>Your name</label>
          <input name="submitterName" required autoComplete="name" placeholder="What should I call you?" maxLength={160} />
        </div>
        <div className="field">
          <label>Contact or social, optional</label>
          <input name="contact" autoComplete="email" placeholder="@name, email, phone, anything useful" maxLength={240} />
        </div>

        <div className="field main-memory-field">
          <label>What do you remember?</label>
          <textarea name="memoryText" required placeholder="Where were we? What happened? What did it feel like?" maxLength={12000} />
        </div>

        <div className="soft-grid">
          <div className="field">
            <label>Approximate date</label>
            <input name="encounterDate" type="date" />
          </div>
          <label className="checkline">
            <input name="isApproximateDate" type="checkbox" />
            <span>This date is a guess</span>
          </label>
        </div>

        <div className="field">
          <label>Place or event</label>
          <input name="eventName" placeholder="Festival, city, venue, school, street, studio..." maxLength={240} />
        </div>
        <div className="field">
          <label>Location details, optional</label>
          <input name="locationName" placeholder="A corner, booth, stage, apartment, line, car..." maxLength={240} />
        </div>
        <div className="soft-grid three">
          <input name="city" placeholder="City" maxLength={120} />
          <input name="region" placeholder="State / region" maxLength={120} />
          <input name="country" placeholder="Country" maxLength={120} />
        </div>

        <div className="prompt-group">
          <p className="kicker">Optional details</p>
          <div className="field"><label>How did we meet?</label><textarea name="howMet" maxLength={4000} /></div>
          <div className="field"><label>What happened before?</label><textarea name="beforeText" maxLength={4000} /></div>
          <div className="field"><label>What happened afterward?</label><textarea name="afterText" maxLength={4000} /></div>
          <div className="field"><label>Did we meet again?</label><textarea name="metAgain" maxLength={4000} /></div>
          <div className="field"><label>Who else was there?</label><textarea name="peoplePresent" maxLength={4000} /></div>
          <div className="field"><label>What was Yeriel / MOFUNDO wearing?</label><textarea name="yerielWearing" maxLength={2000} /></div>
          <div className="field"><label>What were you wearing?</label><textarea name="submitterWearing" maxLength={2000} /></div>
          <div className="field"><label>Clothing, objects, tickets, merch, keepsakes</label><textarea name="artifactInfo" maxLength={4000} /></div>
          <div className="field"><label>What did we talk about?</label><textarea name="talkedAbout" maxLength={4000} /></div>
          <div className="field"><label>Was anything exchanged?</label><textarea name="exchanged" maxLength={2000} /></div>
          <div className="field"><label>What do you think I do not remember about that day?</label><textarea name="forgottenPrompt" maxLength={4000} /></div>
          <div className="field"><label>If this moment were a page in a book, what should it say?</label><textarea name="bookPagePrompt" maxLength={4000} /></div>
          <div className="field"><label>Anything else?</label><textarea name="additionalComments" maxLength={4000} /></div>
        </div>

        <p className="micro-note">Photo, video, and audio uploads come later after private storage is configured.</p>
        <SubmitMemoryButton />
      </form>
    </main>
  );
}
