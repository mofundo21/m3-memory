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
    additionalComments: String(formData.get("additionalComments") || ""),
    mediaLink: String(formData.get("mediaLink") || ""),
    mediaConsent: formData.get("mediaConsent") === "on"
  };

  if (!input.submitterName.trim() || !input.memoryText.trim()) {
    redirect("/remember?error=missing");
  }

  await createSubmission(input);
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

      <section className="intro memory-card" style={{ marginBottom: '48px' }}>
        <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--muted)', marginBottom: '16px' }}>
          Somewhere along the way, our lives crossed. Maybe it was for a few minutes. Maybe we spent an entire weekend together. Maybe we've known each other for years.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--muted)', marginBottom: '16px' }}>
          The strange thing about memory is that two people can live through the same moment and carry completely different pieces of it with them.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--muted)', marginBottom: '16px' }}>
          I've lived a lot of life through festivals, music, friendships, random adventures, late nights, mistakes, conversations, and moments I probably didn't realize were important when they happened. And I know I don't remember all of it.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--muted)', marginBottom: '16px' }}>
          That's why I made M3 Memory. I'm building an archive of the moments other people remember about me — partly to understand my own life better, and partly to help me write my book.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--muted)', marginBottom: '24px' }}>
          Your memory doesn't have to be dramatic. It doesn't have to be perfectly remembered. And it definitely doesn't have to be beautifully written. Just think back for a second. Try to put yourself back there. Let the memory come back however it comes back. Then tell me your version.
        </p>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--purple)', marginBottom: '8px' }}>Before you write</p>
          <ul style={{ margin: '0', paddingLeft: '20px', color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Don't try to tell me what you think I want to hear.</li>
            <li>Don't worry if some details are fuzzy.</li>
            <li>Don't turn it into a perfect story.</li>
            <li>Start with the part that comes back first. The rest usually follows.</li>
          </ul>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>Your submission goes into my private memory archive first. It does not automatically become part of my book or get published. If I later think the memory belongs in a story, I'll review it separately. Your original version stays preserved as you submitted it.</p>
        </div>
      </section>

      <form action={submitMemory} className="memory-card memory-form">
        <div className="intro">
          <h1>Share a Memory</h1>
        </div>

        {hasError ? <p className="error-note">Please add your name and the memory before sending.</p> : null}

        {/* SECTION 1: THE MEMORY */}
        <div className="prompt-group" style={{ marginTop: '0', paddingTop: '0', borderTop: 'none' }}>
          <p className="kicker">The Memory</p>
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
        </div>

        {/* SECTION 2: DETAILS */}
        <div className="prompt-group">
          <p className="kicker">Details</p>
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
        </div>

        {/* SECTION 3: MORE DETAILS */}
        <div className="prompt-group">
          <p className="kicker">More To Tell</p>
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

        {/* SECTION 4: MEDIA & EXTRAS */}
        <div className="prompt-group">
          <p className="kicker">Media & Consent</p>
          <div className="field">
            <label>Links to photos, video, or audio</label>
            <input name="mediaLink" placeholder="Google Drive, Google Photos, Dropbox, YouTube, etc." maxLength={500} />
            <p className="micro-note">Make sure I can access the link. Keep file links short and direct.</p>
          </div>
          <label className="checkline">
            <input name="mediaConsent" type="checkbox" />
            <span>I'm okay with this media being considered for the book or related M3 content.</span>
          </label>
        </div>

        <SubmitMemoryButton />
      </form>
    </main>
  );
}
