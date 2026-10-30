"use client";

import { FormEvent, useState } from "react";

export function MemoryForm() {
  const [dateCertainty, setDateCertainty] = useState("unknown");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const boolean = (name: string) => data.get(name) === "on";
    const payload = Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"));
    Object.assign(payload, {
      archiveStorage: boolean("archiveStorage"), truthful: boolean("truthful"), mediaRights: boolean("mediaRights"),
      publicWebsite: boolean("publicWebsite"), bookEditorial: boolean("bookEditorial"), displayPublicName: boolean("displayPublicName"),
      displaySocial: boolean("displaySocial"), followUpContact: boolean("followUpContact"),
    });
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed.");
      const files = data.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
      if (files.length > 10) throw new Error("Choose no more than 10 evidence files.");
      setReference(result.referenceCode);
      if (files.length) {
        for (let index = 0; index < files.length; index += 1) {
          setUploadMessage(`Uploading ${index + 1} of ${files.length} files...`);
          const uploadResponse = await fetch("/api/uploads", { method: "POST", headers: { "content-type": files[index].type, "x-m3-reference": result.referenceCode, "x-m3-email": String(data.get("email") || ""), "x-m3-filename": encodeURIComponent(files[index].name) }, body: files[index] });
          const uploadResult = await uploadResponse.json();
          if (!uploadResponse.ok) throw new Error(uploadResult.error || `Could not upload ${files[index].name}. Your memory was saved.`);
        }
        setUploadMessage(`${files.length} evidence file${files.length === 1 ? "" : "s"} uploaded.`);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Submission failed."); }
    finally { setSubmitting(false); }
  }

  if (reference) return <section className="card success"><h2>Thank you. Your memory was submitted.</h2><p className="hint">Your story is private and waiting for review. Keep this reference code.</p><div className="reference">{reference}</div>{uploadMessage && <p className="upload-message">{uploadMessage}</p>}{error && <p className="error" role="alert">{error}</p>}</section>;

  return (
    <form className="card" onSubmit={submit}>
      <section><h2>About you</h2><p className="hint">Your contact information stays private.</p><div className="grid">
        <div className="field"><label htmlFor="displayName">Your name or archive name *</label><input id="displayName" name="displayName" required maxLength={120} /></div>
        <div className="field"><label htmlFor="email">Email *</label><input id="email" name="email" type="email" required /></div>
        <div className="field full"><label htmlFor="instagram">Instagram or social profile</label><input id="instagram" name="instagram" placeholder="@username" /></div>
      </div></section>
      <section><h2>When and where did we meet?</h2><p className="hint">Choose the precision you actually remember.</p><div className="grid">
        <div className="field"><label htmlFor="dateCertainty">How certain is the date? *</label><select id="dateCertainty" name="dateCertainty" value={dateCertainty} onChange={(e) => setDateCertainty(e.target.value)}><option value="unknown">I don't know</option><option value="approximate">Approximate</option><option value="exact">Exact</option></select></div>
        {dateCertainty === "exact" && <div className="field"><label htmlFor="occurredOn">Exact date *</label><input id="occurredOn" name="occurredOn" type="date" required /></div>}
        {dateCertainty === "approximate" && <div className="field"><label htmlFor="approximateDateText">About when? *</label><input id="approximateDateText" name="approximateDateText" required placeholder="Summer 2019, around my 25th birthday..." /></div>}
        <div className="field"><label htmlFor="eventName">Event or festival</label><input id="eventName" name="eventName" /></div>
        <div className="field"><label htmlFor="venue">Venue</label><input id="venue" name="venue" /></div>
        <div className="field"><label htmlFor="city">City</label><input id="city" name="city" /></div>
        <div className="field"><label htmlFor="region">State or region</label><input id="region" name="region" /></div>
        <div className="field full"><label htmlFor="country">Country</label><input id="country" name="country" defaultValue="United States" /></div>
        <div className="field full"><label htmlFor="story">How did we meet? *</label><textarea id="story" name="story" required minLength={20} placeholder="Start wherever the memory starts for you..." /></div>
      </div></section>
      <section><h2>Tell the story</h2><p className="hint">The small details are often the archive's most valuable pieces.</p><div className="grid">
        <div className="field full"><label htmlFor="conversationDetails">What did we talk about?</label><textarea id="conversationDetails" name="conversationDetails" /></div>
        <div className="field"><label htmlFor="mofundoWearing">What was I wearing?</label><textarea id="mofundoWearing" name="mofundoWearing" /></div>
        <div className="field"><label htmlFor="contributorWearing">What were you wearing?</label><textarea id="contributorWearing" name="contributorWearing" /></div>
        <div className="field full"><label htmlFor="firstImpression">What was your first impression?</label><textarea id="firstImpression" name="firstImpression" /></div>
        <div className="field full"><label htmlFor="meaningfulDetails">What was funny, strange, or meaningful?</label><textarea id="meaningfulDetails" name="meaningfulDetails" /></div>
        <div className="field full"><label htmlFor="thingsExchanged">Did we exchange anything?</label><textarea id="thingsExchanged" name="thingsExchanged" placeholder="An object, art, contact information, advice, a promise..." /></div>
        <div className="field full"><label htmlFor="forgottenDetail">What do you think I don't remember about this day?</label><textarea id="forgottenDetail" name="forgottenDetail" /></div>
        <div className="field full"><label htmlFor="bookPageMessage">If this moment were a page in a book, what would you want that page to say?</label><textarea id="bookPageMessage" name="bookPageMessage" /></div>
      </div></section>
      <section><h2>Permissions</h2><p className="hint">Saving, publishing, and book use are separate decisions. Nothing becomes public automatically.</p><fieldset>
        <label className="choice"><input type="checkbox" name="archiveStorage" required /> I allow this story to be stored privately in the M3 Memory Archive. *</label>
        <label className="choice"><input type="checkbox" name="truthful" required /> This is truthful to the best of my memory. *</label>
        <label className="choice"><input type="checkbox" name="mediaRights" required /> I own anything I upload or have permission to share it. *</label>
        <label className="choice"><input type="checkbox" name="publicWebsite" /> You may consider this story for the public website after review.</label>
        <label className="choice"><input type="checkbox" name="bookEditorial" /> You may consider this story for a book or editorial project.</label>
        <label className="choice"><input type="checkbox" name="displayPublicName" /> If published, you may display my chosen name.</label>
        <label className="choice"><input type="checkbox" name="displaySocial" /> If published, you may display my social profile.</label>
        <label className="choice"><input type="checkbox" name="followUpContact" /> You may contact me with follow-up questions.</label>
      </fieldset></section>
      <section><h2>Evidence files</h2><p className="hint">Optional. Choose up to 10 photos, videos, audio files, or PDFs. Maximum 25 MB each.</p><div className="field"><label htmlFor="evidence">Choose files</label><input id="evidence" name="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,audio/mpeg,audio/mp4,audio/wav,application/pdf" /></div></section>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit memory"}</button></div>
    </form>
  );
}
