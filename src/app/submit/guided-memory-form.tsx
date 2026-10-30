"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

const DRAFT_KEY = "mofundo-memory-draft-v2";
const stepNames = ["You", "First Encounter", "The Moment", "The Conversation", "What Happened After", "Evidence", "Permissions & Review"];

export function GuidedMemoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [dateCertainty, setDateCertainty] = useState("unknown");
  const [seenSince, setSeenSince] = useState("");
  const [toldAnyone, setToldAnyone] = useState("");
  const [relationshipToday, setRelationshipToday] = useState("");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw || !formRef.current) return;
    try {
      const draft = JSON.parse(raw) as Record<string, string | boolean>;
      for (const [name, value] of Object.entries(draft)) {
        const control = formRef.current.elements.namedItem(name);
        if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = Boolean(value);
        else if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) control.value = String(value);
      }
      setDateCertainty(String(draft.dateCertainty || "unknown"));
      setSeenSince(String(draft.seenSince || ""));
      setToldAnyone(String(draft.toldAnyone || ""));
      setRelationshipToday(String(draft.relationshipToday || ""));
    } catch { localStorage.removeItem(DRAFT_KEY); }
  }, []);

  function saveDraft() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const draft: Record<string, string | boolean> = {};
    for (const [name, value] of data.entries()) if (typeof value === "string") draft[name] = value;
    formRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => { draft[input.name] = input.checked; });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function nextStep() {
    setError("");
    const form = formRef.current;
    if (!form) return;
    const requiredByStep: Record<number, string[]> = { 0: ["displayName", "email"], 1: ["story"] };
    for (const name of requiredByStep[step] || []) {
      const control = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!control?.value.trim()) { setError("Please complete the required question before continuing."); control?.focus(); return; }
    }
    saveDraft(); setStep((value) => Math.min(value + 1, stepNames.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const checked = (name: string) => data.get(name) === "on";
    const payload = Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"));
    Object.assign(payload, {
      archiveStorage: checked("archiveStorage"), truthful: checked("truthful"), mediaRights: checked("mediaRights"),
      publicWebsite: checked("publicWebsite"), bookEditorial: checked("bookEditorial"), displayPublicName: checked("displayPublicName"),
      displaySocial: checked("displaySocial"), followUpContact: checked("followUpContact"),
    });
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed.");
      setReference(result.referenceCode);
      const files = data.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
      if (files.length > 10) throw new Error("Choose no more than 10 evidence files.");
      for (let index = 0; index < files.length; index += 1) {
        setUploadMessage(`Uploading ${index + 1} of ${files.length} files...`);
        const file = files[index];
        const metadata = JSON.parse(String(data.get("evidenceMetadata") || "[]"))[index] || {};
        const uploadResponse = await fetch("/api/uploads", { method: "POST", headers: { "content-type": file.type, "x-archive-reference": result.referenceCode, "x-upload-token": result.uploadToken, "x-archive-filename": encodeURIComponent(file.name), "x-media-category": encodeURIComponent(metadata.category || "Other"), "x-media-caption": encodeURIComponent(metadata.caption || ""), "x-media-description": encodeURIComponent(metadata.description || ""), "x-media-people": encodeURIComponent(metadata.people || ""), "x-media-date": encodeURIComponent(metadata.date || "") }, body: file });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadResult.error || `Could not upload ${file.name}. Your memory was saved.`);
      }
      if (files.length) setUploadMessage(`${files.length} evidence file${files.length === 1 ? "" : "s"} uploaded.`);
      localStorage.removeItem(DRAFT_KEY);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Submission failed."); }
    finally { setSubmitting(false); }
  }

  if (reference) return <section className="memory-complete"><p className="step-kicker">Memory received</p><h2>Thank you for contributing a piece of history.</h2><p>Your memory is private and waiting for review.</p><strong className="reference">{reference}</strong>{uploadMessage && <p>{uploadMessage}</p>}{error && <p className="error">{error}</p>}</section>;

  return <form ref={formRef} className="guided-form" onSubmit={submit} onChange={saveDraft} noValidate>
    <div className="step-progress" aria-label={`Step ${step + 1} of ${stepNames.length}`}><div className="step-progress-bar" style={{ width: `${((step + 1) / stepNames.length) * 100}%` }} /><span>{String(step + 1).padStart(2, "0")} / {String(stepNames.length).padStart(2, "0")} — {stepNames[step]}</span></div>

    <Step active={step === 0} title="Let's start with you" note="Only your name and email are required. Everything else is optional.">
      <Grid><Question label="Your name or archive name" required><input name="displayName" /></Question><Question label="Email" required><input name="email" type="email" /></Question><Question label="Instagram or social profile" wide><input name="instagram" placeholder="@username" /></Question><Question label="What did MOFUNDO or Yeriel know you as at the time?" wide><input name="knownAsAtTime" /></Question><Question label="Where were you living when we met?"><input name="livingAtTime" /></Question><Question label="How do you know MOFUNDO today?"><Select name="relationshipToday" value={relationshipToday} onChange={setRelationshipToday} options={["Friend","Festival friend","Music","Work","Photography","Online","Community","Only met once","Other"]} /></Question>{relationshipToday === "Other" && <Question label="Describe the connection" wide><input name="relationshipTodayOther" /></Question>}</Grid>
    </Step>

    <Step active={step === 1} title="The first encounter" note="You don't have to remember everything. Approximate details are useful.">
      <Grid><Question label="Was this definitely the first time we met?"><Select name="definitelyFirstMeeting" options={["Yes","I think so","No","Not sure"]} /></Question><Question label="How certain is the date?"><Select name="dateCertainty" value={dateCertainty} onChange={setDateCertainty} options={["exact|Exact","approximate|Approximate","unknown|Unknown"]} /></Question>{dateCertainty === "exact" && <Question label="Exact date"><input name="occurredOn" type="date" /></Question>}{dateCertainty === "approximate" && <Question label="About when?"><input name="approximateDateText" placeholder="Summer 2019, around my birthday..." /></Question>}<Question label="Approximate time of day"><Select name="timeOfDay" options={["Morning","Afternoon","Sunset","Night","Late night","No idea"]} /></Question><Question label="Event or festival"><input name="eventName" /></Question><Question label="Venue"><input name="venue" /></Question><Question label="City"><input name="city" /></Question><Question label="State or region"><input name="region" /></Question><Question label="Country"><input name="country" defaultValue="United States" /></Question><Question label="Where exactly were we?" wide><Text name="exactPlace" /></Question><Question label="Who were you with?"><Text name="contributorWith" /></Question><Question label="Who was MOFUNDO with?"><Text name="mofundoWith" /></Question><Question label="Who introduced us?"><input name="introducedBy" /></Question><Question label="How long did we talk or hang out?"><Select name="timeTogether" options={["Under 5 minutes","5–15 minutes","15–30 minutes","30–60 minutes","Hours","Most of the day/night","Unknown"]} /></Question><Question label="What was happening around us?" wide><Text name="surroundings" /></Question><Question label="What happened immediately before we met?" wide><Text name="immediatelyBefore" /></Question><Question label="How did we meet?" required wide><Text name="story" placeholder="Start wherever the memory starts for you..." /></Question></Grid>
    </Step>

    <Step active={step === 2} title="Help me reconstruct the moment" note="Open only the prompts that spark something. Leave the rest blank.">
      <PromptGroup title="How we looked and what we carried"><Grid><Question label="What was MOFUNDO wearing?"><Text name="mofundoWearing" /></Question><Question label="What were you wearing?"><Text name="contributorWearing" /></Question><Question label="What did MOFUNDO's hair, style, or look look like?"><Text name="mofundoHairStyle" /></Question><Question label="Was MOFUNDO carrying anything?"><Text name="mofundoCarrying" /></Question><Question label="What were you carrying?"><Text name="contributorCarrying" /></Question></Grid></PromptGroup>
      <PromptGroup title="What the place felt like"><Grid><Question label="What music was playing?"><Text name="musicPlaying" /></Question><Question label="Do you remember the DJ, artist, or set?"><Text name="artistOrSet" /></Question><Question label="What did the place look like?"><Text name="placeAppearance" /></Question><Question label="Was there something distinctive nearby?"><Text name="distinctiveNearby" /></Question><Question label="What do you remember hearing?"><Text name="rememberedHearing" /></Question><Question label="What do you remember seeing?"><Text name="rememberedSeeing" /></Question></Grid></PromptGroup>
      <PromptGroup title="The small details that stayed"><Grid><Question label="What's the smallest detail from that day that you still remember?" wide><Text name="smallestDetail" /></Question><Question label="What was funny, strange, or meaningful?" wide><Text name="meaningfulDetails" /></Question></Grid></PromptGroup>
    </Step>

    <Step active={step === 3} title="The conversation" note="Fragments, quotes, feelings, and half-remembered phrases are all welcome.">
      <Grid><Question label="What did we talk about?" wide><Text name="conversationDetails" /></Question><Question label="What did you think of me before we talked?"><Text name="impressionBeforeTalking" /></Question><Question label="What did you think of me after we talked?"><Text name="impressionAfterTalking" /></Question><Question label="Do you remember anything MOFUNDO said word-for-word?"><Text name="mofundoExactWords" /></Question><Question label="Do you remember anything you said?"><Text name="contributorExactWords" /></Question><Question label="Did MOFUNDO tell you about something he was working on?"><Text name="mofundoWorkDiscussed" /></Question><Question label="Did you talk about music?"><Select name="talkedAboutMusic" options={["Yes","No","Not sure"]} /></Question><Question label="Did you talk about something personal?"><Select name="talkedAboutPersonal" options={["Yes","No","Not sure"]} /></Question><Question label="Did either of you tell a story?" wide><Text name="storyTold" /></Question><Question label="Was there a joke, phrase, or quote you remember?" wide><Text name="rememberedQuoteOrJoke" /></Question><Question label="What was your first impression?" wide><Text name="firstImpression" /></Question></Grid>
    </Step>

    <Step active={step === 4} title="What happened after?" note="This helps connect a first meeting to the history that followed.">
      <Grid><Question label="Did we keep hanging out that day or night?"><Select name="keptHangingOut" options={["Yes","No","Not sure"]} /></Question><Question label="Did we exchange contact information?"><Select name="exchangedContact" options={["Yes","No","Not sure"]} /></Question><Question label="Did you follow or contact me afterward?"><Select name="contactedAfterward" options={["Yes","No","Not sure"]} /></Question><Question label="Did you expect we'd see each other again?"><Select name="expectedToMeetAgain" options={["Yes","No","Not sure"]} /></Question><Question label="Did you tell anyone about meeting me?"><Select name="toldAnyone" value={toldAnyone} onChange={setToldAnyone} options={["Yes","No","Not sure"]} /></Question>{toldAnyone === "Yes" && <Question label="What did you tell them?" wide><Text name="toldAnyoneDetails" /></Question>}<Question label="Have we seen each other since?"><Select name="seenSince" value={seenSince} onChange={setSeenSince} options={["Yes","No","Not sure"]} /></Question>{seenSince === "Yes" && <><Question label="Where did we see each other next?"><Text name="nextSeenWhere" /></Question><Question label="Approximately when?"><input name="nextSeenWhen" /></Question><Question label="What happened that time?" wide><Text name="nextSeenStory" /></Question><Question label="Approximately how many times have we met?"><Select name="encounterCount" options={["2","3–5","6–10","10+","Lost count"]} /></Question></>}<Question label="How would you describe our connection today?" wide><Text name="connectionToday" /></Question><Question label="Has knowing me affected your life in any way?" wide><Text name="lifeEffect" /></Question><Question label="Have you watched MOFUNDO or Yeriel change over time?" wide><Text name="changeOverTime" /></Question><Question label="When you first met me, what did you know me as?"><Select name="firstKnownIdentity" options={["Yeriel","MOFUNDO","Both","Something else"]} /></Question><Question label="Did you know I made music at the time?"><Select name="knewMusicAtTime" options={["Yes","No","Not sure"]} /></Question><Question label="Did you know about the book at the time?"><Select name="knewBookAtTime" options={["Yes","No","Not sure"]} /></Question><Question label="What do you think I don't remember about this day?" wide><Text name="forgottenDetail" /></Question><Question label="Is there something about this story you have never told me?" wide><Text name="neverToldDetail" /></Question><Question label="Is there anything you remember differently from how I might remember it?" wide><Text name="differingMemory" /></Question><Question label="If this moment were a page in a book, what would you want that page to say?" wide><Text name="bookPageMessage" /></Question><Question label="Did we exchange anything?" wide><Text name="thingsExchanged" /></Question></Grid>
    </Step>

    <Step active={step === 5} title="Show me what survived" note="Photos, videos, screenshots, flyers, tickets, voice notes, or anything else that helps reconstruct the memory.">
      <EvidencePicker />
    </Step>

    <Step active={step === 6} title="Permissions and review" note="Nothing becomes public automatically. You can give separate permission for different uses.">
      <div className="review-reminder"><strong>You don't have to remember everything.</strong><p>Your answers will enter a private archive for review. You can go back and change anything before submitting.</p></div>
      <fieldset className="permission-list"><Check name="archiveStorage" required>I allow this story to be stored privately in the MOFUNDO Memory Archive.</Check><Check name="truthful" required>This is truthful to the best of my memory.</Check><Check name="mediaRights" required>I own anything I upload or have permission to share it.</Check><Check name="publicWebsite">You may consider this story for the public website after review.</Check><Check name="bookEditorial">You may consider this story for a book or editorial project.</Check><Check name="displayPublicName">If published, you may display my chosen name.</Check><Check name="displaySocial">If published, you may display my social profile.</Check><Check name="followUpContact">You may contact me with follow-up questions.</Check></fieldset>
    </Step>

    {error && <p className="error" role="alert">{error}</p>}
    <div className="step-actions">{step > 0 ? <button type="button" className="secondary-action" onClick={() => { setStep(step - 1); window.scrollTo({top:0,behavior:"smooth"}); }}>Back</button> : <span />}{step < stepNames.length - 1 ? <button type="button" className="primary-action" onClick={nextStep}>Continue</button> : <button className="primary-action" disabled={submitting}>{submitting ? "Submitting..." : "Submit memory"}</button>}</div>
  </form>;
}

function Step({ active, title, note, children }: { active: boolean; title: string; note: string; children: ReactNode }) { return <section className="form-step" hidden={!active}><p className="step-kicker">A memory interview</p><h2>{title}</h2><p className="step-note">{note}</p>{children}</section>; }
function Grid({ children }: { children: ReactNode }) { return <div className="question-grid">{children}</div>; }
function Question({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: ReactNode }) { return <label className={`question${wide ? " wide" : ""}`}><span>{label}{required ? " *" : ""}</span>{children}</label>; }
function Text({ name, placeholder }: { name: string; placeholder?: string }) { return <textarea name={name} placeholder={placeholder} />; }
function Select({ name, options, value, onChange }: { name: string; options: string[]; value?: string; onChange?: (value: string) => void }) { return <select name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} defaultValue={value === undefined ? "" : undefined}><option value="">Choose if you remember</option>{options.map((option) => { const [optionValue, label] = option.includes("|") ? option.split("|") : [option, option]; return <option value={optionValue} key={optionValue}>{label}</option>; })}</select>; }
function PromptGroup({ title, children }: { title: string; children: ReactNode }) { return <details className="prompt-group"><summary>{title}<span>Open prompts</span></summary><div className="prompt-body">{children}</div></details>; }
function Check({ name, required, children }: { name: string; required?: boolean; children: ReactNode }) { return <label className="permission"><input type="checkbox" name={name} required={required} /><span>{children}{required ? " *" : ""}</span></label>; }
function EvidencePicker() {
  const [files, setFiles] = useState<Array<{name:string;category:string;caption:string;description:string;people:string;date:string}>>([]);
  function update(index:number,key:string,value:string){setFiles((current)=>current.map((item,itemIndex)=>itemIndex===index?{...item,[key]:value}:item));}
  return <div className="evidence-picker"><input name="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,audio/mpeg,audio/mp4,audio/wav,application/pdf" onChange={(event)=>setFiles(Array.from(event.target.files||[]).slice(0,10).map((file)=>({name:file.name,category:file.type.startsWith("image/")?"Photo":file.type.startsWith("video/")?"Video":file.type.startsWith("audio/")?"Audio / voice note":file.type==="application/pdf"?"Document / other":"Other",caption:"",description:"",people:"",date:""})))} /><div className="evidence-types"><span>Photos</span><span>Videos</span><span>Screenshots</span><span>Voice notes</span><span>Flyers & tickets</span><span>Documents</span></div><p>Up to 10 files, maximum 25 MB each. Files are never stored in your local draft.</p><input type="hidden" name="evidenceMetadata" value={JSON.stringify(files)} />{files.map((file,index)=><div className="file-metadata" key={`${file.name}-${index}`}><strong>{file.name}</strong><Grid><Question label="Type"><select value={file.category} onChange={(event)=>update(index,"category",event.target.value)}><option>Photo</option><option>Video</option><option>Screenshot</option><option>Audio / voice note</option><option>Flyer / ticket</option><option>Document / other</option></select></Question><Question label="Approximate date"><input value={file.date} onChange={(event)=>update(index,"date",event.target.value)} /></Question><Question label="What's happening here?" wide><textarea value={file.description} onChange={(event)=>update(index,"description",event.target.value)} /></Question><Question label="Who is pictured?"><input value={file.people} onChange={(event)=>update(index,"people",event.target.value)} /></Question><Question label="Caption"><input value={file.caption} onChange={(event)=>update(index,"caption",event.target.value)} /></Question></Grid></div>)}</div>;
}
