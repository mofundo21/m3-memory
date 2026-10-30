"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

const DRAFT_KEY = "mofundo-memory-draft-v3";
const steps = ["You", "Where & When", "The Story", "Evidence & Permission"];
const platforms = ["Instagram", "TikTok", "Facebook", "X / Twitter", "Threads", "YouTube", "Snapchat", "Discord", "Twitch", "LinkedIn", "Chess.com", "Website", "Other"];
type Profile = { platform: string; handle: string; howWeMet: boolean };

export function V3MemoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"quick" | "deep">("quick");
  const [dateCertainty, setDateCertainty] = useState("unknown");
  const [seenSince, setSeenSince] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
      setMode(draft.memoryMode === "deep" ? "deep" : "quick");
      setDateCertainty(String(draft.dateCertainty || "unknown"));
      setSeenSince(String(draft.seenSince || ""));
      if (typeof draft.socialProfiles === "string") setProfiles(JSON.parse(draft.socialProfiles));
    } catch { localStorage.removeItem(DRAFT_KEY); }
  }, []);

  function saveDraft() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const draft: Record<string, string | boolean> = {};
    for (const [name, value] of data.entries()) if (typeof value === "string") draft[name] = value;
    formRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => { if (input.name) draft[input.name] = input.checked; });
    draft.memoryMode = mode;
    draft.socialProfiles = JSON.stringify(profiles);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function next() {
    setError("");
    const form = formRef.current;
    if (!form) return;
    const required = step === 0 ? ["displayName", "email"] : step === 2 ? ["story"] : [];
    for (const name of required) {
      const control = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!control?.value.trim()) { setError("Please complete the required question before continuing."); control?.focus(); return; }
    }
    if (step === 1 && dateCertainty === "exact" && !(form.elements.namedItem("occurredOn") as HTMLInputElement)?.value) { setError("Choose the exact date or change the date certainty."); return; }
    if (step === 1 && dateCertainty === "approximate" && !(form.elements.namedItem("approximateDateText") as HTMLInputElement)?.value.trim()) { setError("Tell us approximately when, or change the date certainty."); return; }
    saveDraft(); setStep((current) => Math.min(current + 1, steps.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const checked = (name: string) => data.get(name) === "on";
    const payload: Record<string, unknown> = Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"));
    payload.socialProfiles = profiles.filter((profile) => profile.handle.trim()).map((profile) => ({ ...profile, handle: profile.handle.trim() }));
    Object.assign(payload, { archiveStorage: checked("archiveStorage"), truthful: checked("truthful"), mediaRights: checked("mediaRights"), publicWebsite: checked("publicWebsite"), bookEditorial: checked("bookEditorial"), displayPublicName: checked("displayPublicName"), displaySocial: checked("displaySocial"), followUpContact: checked("followUpContact") });
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed.");
      setReference(result.referenceCode);
      const files = data.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
      for (let index = 0; index < files.length; index += 1) {
        setUploadMessage(`Uploading ${index + 1} of ${files.length} files...`);
        const file = files[index];
        const metadata = JSON.parse(String(data.get("evidenceMetadata") || "[]"))[index] || {};
        const uploadResponse = await fetch("/api/uploads", { method: "POST", headers: { "content-type": file.type, "x-archive-reference": result.referenceCode, "x-upload-token": result.uploadToken, "x-archive-filename": encodeURIComponent(file.name), "x-media-category": encodeURIComponent(metadata.category || "Other"), "x-media-caption": encodeURIComponent(metadata.caption || ""), "x-media-description": encodeURIComponent(metadata.description || ""), "x-media-people": encodeURIComponent(metadata.people || ""), "x-media-date": encodeURIComponent(metadata.date || "") }, body: file });
        if (!uploadResponse.ok) throw new Error(`Could not upload ${file.name}. Your memory was saved.`);
      }
      if (files.length) setUploadMessage(`${files.length} evidence file${files.length === 1 ? "" : "s"} uploaded.`);
      localStorage.removeItem(DRAFT_KEY);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Submission failed."); }
    finally { setSubmitting(false); }
  }

  if (reference) return <section className="memory-complete"><p className="step-kicker">Memory received</p><h2>Thank you for contributing a piece of history.</h2><p>Your memory is private and waiting for review.</p><strong className="reference">{reference}</strong>{uploadMessage && <p>{uploadMessage}</p>}</section>;

  return <form ref={formRef} className="guided-form" onSubmit={submit} onChange={saveDraft} noValidate>
    <div className="step-progress" aria-label={`Step ${step + 1} of ${steps.length}`}><div className="step-progress-bar" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /><span>{String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")} — {steps[step]}</span></div>
    <Step active={step === 0} title="Start with you" note="Your name and email are the only required details here.">
      <div className="memory-mode"><button type="button" className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}><strong>Quick Memory</strong><span>Just the important parts</span></button><button type="button" className={mode === "deep" ? "active" : ""} onClick={() => setMode("deep")}><strong>Tell Me More</strong><span>Extra prompts if you remember a lot</span></button></div><input type="hidden" name="memoryMode" value={mode} />
      <Grid><Question label="Your name or archive name" required><input name="displayName" autoComplete="name" /></Question><Question label="Email" required><input name="email" type="email" autoComplete="email" inputMode="email" /></Question><Question label="How do you know me today?" wide><Select name="relationshipToday" options={["Friend","Festival friend","Music","Work","Photography","Online","Community","Only met once","Other"]} /></Question></Grid>
      <SocialProfiles profiles={profiles} setProfiles={setProfiles} />
      {mode === "deep" && <Prompt title="A little more about you"><Grid><Question label="What did MOFUNDO or Yeriel know you as then?"><input name="knownAsAtTime" /></Question><Question label="Where were you living when we met?"><input name="livingAtTime" /></Question></Grid></Prompt>}
    </Step>
    <Step active={step === 1} title="Where and when?" note="An approximate date or partial location is completely fine.">
      <Grid><Question label="Was this definitely our first meeting?"><Select name="definitelyFirstMeeting" options={["Yes","I think so","No","Not sure"]} /></Question><Question label="How certain is the date?"><Select name="dateCertainty" value={dateCertainty} onChange={setDateCertainty} options={["exact|Exact","approximate|Approximate","unknown|Unknown"]} /></Question>{dateCertainty === "exact" && <Question label="Exact date"><input name="occurredOn" type="date" /></Question>}{dateCertainty === "approximate" && <Question label="About when?"><input name="approximateDateText" placeholder="Summer 2019, around my birthday..." /></Question>}<Question label="Event or festival"><input name="eventName" /></Question><Question label="Venue or exact place"><input name="venue" /></Question><Question label="City"><input name="city" /></Question><Question label="State, region, or country"><input name="region" /></Question><Question label="Who was there?" wide><Text name="contributorWith" placeholder="Who were you with, who was I with, or who introduced us?" /></Question></Grid>
      {mode === "deep" && <Prompt title="More scene details"><Grid><Question label="Approximate time of day"><Select name="timeOfDay" options={["Morning","Afternoon","Sunset","Night","Late night","No idea"]} /></Question><Question label="Who introduced us?"><input name="introducedBy" /></Question><Question label="How long were we together?"><Select name="timeTogether" options={["Under 5 minutes","5–15 minutes","15–30 minutes","30–60 minutes","Hours","Most of the day/night","Unknown"]} /></Question><Question label="What was happening around us?" wide><Text name="surroundings" /></Question></Grid></Prompt>}
    </Step>
    <Step active={step === 2} title="Tell me the story" note="Tell it naturally. It does not need to be perfectly ordered or complete.">
      <Grid><Question label="How did we meet, and what happened?" required wide><Text name="story" placeholder="Start wherever the memory starts for you..." /></Question><Question label="What did we talk about? Include any exact words, jokes, or quotes you remember." wide><Text name="conversationDetails" /></Question><Question label="What happened after we met?" wide><Text name="meaningfulDetails" /></Question><Question label="Have we seen each other since?"><Select name="seenSince" value={seenSince} onChange={setSeenSince} options={["Yes","No","Not sure"]} /></Question>{seenSince === "Yes" && <Question label="What happened the next time?" wide><Text name="nextEncounterStory" placeholder="Where, approximately when, and what do you remember?" /></Question>}</Grid>
      <div className="signature-prompts"><h3>Three details that can unlock a memory</h3><Grid><Question label="What's the smallest detail you still remember?" wide><Text name="smallestDetail" /></Question><Question label="What do you think I don't remember?" wide><Text name="forgottenDetail" /></Question><Question label="If this were a page in a book, what should it say?" wide><Text name="bookPageMessage" /></Question></Grid></div>
      {mode === "deep" && <Prompt title="I remember more"><Grid><Question label="What did you think of me before we talked?"><Text name="impressionBeforeTalking" /></Question><Question label="What did you think of me after we talked?"><Text name="impressionAfterTalking" /></Question><Question label="What do you remember seeing, hearing, or noticing around us?" wide><Text name="rememberedSeeing" /></Question><Question label="Is there something about this story you have never told me?" wide><Text name="neverToldDetail" /></Question><Question label="Do you remember it differently from how I might?" wide><Text name="differingMemory" /></Question><Question label="How would you describe our connection today?" wide><Text name="connectionToday" /></Question></Grid></Prompt>}
    </Step>
    <Step active={step === 3} title="Show me what survived" note="Evidence is optional. Nothing becomes public automatically."><EvidencePicker /><fieldset className="permission-list"><legend>Permissions</legend><Check name="archiveStorage" required>I allow this story to be stored privately in the MOFUNDO Memory Archive.</Check><Check name="truthful" required>This is truthful to the best of my memory.</Check><Check name="mediaRights" required>I own anything I upload or have permission to share it.</Check><Check name="publicWebsite">You may consider this story for the public website after review.</Check><Check name="bookEditorial">You may consider this story for a book or editorial project.</Check><Check name="displayPublicName">If published, you may display my chosen name.</Check><Check name="displaySocial">If published, you may display my social profiles.</Check><Check name="followUpContact">You may contact me with follow-up questions.</Check></fieldset></Step>
    {error && <p className="error" role="alert">{error}</p>}<div className="step-actions">{step > 0 ? <button type="button" className="secondary-action" onClick={() => setStep(step - 1)}>Back</button> : <span />}{step < steps.length - 1 ? <button type="button" className="primary-action" onClick={next}>Continue</button> : <button className="primary-action" disabled={submitting}>{submitting ? "Saving your memory..." : "Add this memory to the archive"}</button>}</div>
  </form>;
}

function SocialProfiles({ profiles, setProfiles }: { profiles: Profile[]; setProfiles: (profiles: Profile[]) => void }) { const update=(index:number,patch:Partial<Profile>)=>setProfiles(profiles.map((profile,i)=>i===index?{...profile,...patch}:profile)); return <section className="social-profiles"><div className="section-inline-head"><div><h3>Social profiles</h3><p>Add any accounts you want connected to your private Person record.</p></div><button type="button" className="secondary-action" onClick={()=>setProfiles([...profiles,{platform:"Instagram",handle:"",howWeMet:false}])}>+ Add a profile</button></div>{profiles.map((profile,index)=><div className="social-profile-row" key={index}><label><span>Platform</span><select value={profile.platform} onChange={(event)=>update(index,{platform:event.target.value})}>{platforms.map((platform)=><option key={platform}>{platform}</option>)}</select></label><label className="social-handle"><span>Username or profile link</span><input value={profile.handle} onChange={(event)=>update(index,{handle:event.target.value})} placeholder="@username or link" /></label><label className="how-we-met"><input type="checkbox" checked={profile.howWeMet} onChange={(event)=>update(index,{howWeMet:event.target.checked})} /><span>Is this how we met?</span></label><button type="button" className="remove-profile" onClick={()=>setProfiles(profiles.filter((_,i)=>i!==index))}>Remove</button></div>)}</section>; }
function Step({active,title,note,children}:{active:boolean;title:string;note:string;children:ReactNode}){return <section className="form-step" hidden={!active}><p className="step-kicker">A memory interview</p><h2>{title}</h2><p className="step-note">{note}</p>{children}</section>;}
function Grid({children}:{children:ReactNode}){return <div className="question-grid">{children}</div>;}
function Question({label,required,wide,children}:{label:string;required?:boolean;wide?:boolean;children:ReactNode}){return <label className={`question${wide?" wide":""}`}><span>{label}{required?" *":""}</span>{children}</label>;}
function Text({name,placeholder}:{name:string;placeholder?:string}){return <textarea name={name} placeholder={placeholder}/>;}
function Select({name,options,value,onChange}:{name:string;options:string[];value?:string;onChange?:(value:string)=>void}){return <select name={name} value={value} onChange={onChange?(event)=>onChange(event.target.value):undefined} defaultValue={value===undefined?"":undefined}><option value="">Choose if you remember</option>{options.map((option)=>{const [v,label]=option.includes("|")?option.split("|"):[option,option];return <option value={v} key={v}>{label}</option>;})}</select>;}
function Prompt({title,children}:{title:string;children:ReactNode}){return <details className="prompt-group"><summary>{title}<span>Optional</span></summary><div className="prompt-body">{children}</div></details>;}
function Check({name,required,children}:{name:string;required?:boolean;children:ReactNode}){return <label className="permission"><input type="checkbox" name={name} required={required}/><span>{children}{required?" *":""}</span></label>;}
function EvidencePicker(){const [files,setFiles]=useState<Array<{name:string;category:string;caption:string;description:string;people:string;date:string}>>([]);const update=(index:number,key:string,value:string)=>setFiles((current)=>current.map((item,i)=>i===index?{...item,[key]:value}:item));return <div className="evidence-picker"><input name="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,audio/mpeg,audio/mp4,audio/wav,application/pdf" onChange={(event)=>setFiles(Array.from(event.target.files||[]).slice(0,10).map((file)=>({name:file.name,category:file.type.startsWith("image/")?"Photo":file.type.startsWith("video/")?"Video":file.type.startsWith("audio/")?"Audio / voice note":file.type==="application/pdf"?"Document / other":"Other",caption:"",description:"",people:"",date:""})))} /><div className="evidence-types"><span>Photos</span><span>Videos</span><span>Screenshots</span><span>Voice notes</span><span>Flyers & tickets</span><span>Documents</span></div><p>Up to 10 files. Files are never stored in your local draft.</p><input type="hidden" name="evidenceMetadata" value={JSON.stringify(files)}/>{files.map((file,index)=><div className="file-metadata" key={`${file.name}-${index}`}><strong>{file.name}</strong><Grid><Question label="Type"><select value={file.category} onChange={(event)=>update(index,"category",event.target.value)}><option>Photo</option><option>Video</option><option>Screenshot</option><option>Audio / voice note</option><option>Flyer / ticket</option><option>Document / other</option></select></Question><Question label="Approximate date"><input value={file.date} onChange={(event)=>update(index,"date",event.target.value)}/></Question><Question label="What's happening here?" wide><textarea value={file.description} onChange={(event)=>update(index,"description",event.target.value)}/></Question><Question label="Who is pictured?"><input value={file.people} onChange={(event)=>update(index,"people",event.target.value)}/></Question><Question label="Caption"><input value={file.caption} onChange={(event)=>update(index,"caption",event.target.value)}/></Question></Grid></div>)}</div>;}
