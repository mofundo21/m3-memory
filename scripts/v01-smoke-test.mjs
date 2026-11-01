import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { DatabaseSync } from "node:sqlite";
import puppeteer from "puppeteer";

const port = Number(process.env.V01_TEST_PORT || 3199);
const base = `http://127.0.0.1:${port}`;
const dbPath = `.m3-memory/v01-smoke-${port}-${Date.now()}.sqlite`;
const adminPassword = "fictional-v01-admin-password";
const sessionSecret = "fictional-v01-session-secret-with-length";

mkdirSync(".m3-memory", { recursive: true });
const command = process.platform === "win32" ? "cmd.exe" : "npm";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", `npm run start -- -p ${port}`]
  : ["run", "start", "--", "-p", String(port)];
const child = spawn(command, args, {
  env: { ...process.env, M3_PERSISTENCE: "sqlite", M3_ADMIN_AUTH: "local", DATABASE_PATH: dbPath, ADMIN_PASSWORD: adminPassword, SESSION_SECRET: sessionSecret },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true
});

let logs = "";
child.stdout.on("data", (chunk) => { logs += chunk.toString(); });
child.stderr.on("data", (chunk) => { logs += chunk.toString(); });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`production server did not start:\n${logs}`);
}

function actionFields(html) {
  const fields = {};
  for (const match of html.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)) {
    fields[decode(match[1])] = decode(match[2] || "");
  }
  return fields;
}

function decode(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function form(fields) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return body;
}

async function postForm(path, fields, cookie) {
  return fetch(`${base}${path}`, {
    method: "POST",
    body: form(fields),
    redirect: "manual",
    headers: cookie ? { cookie } : undefined
  });
}

// ---- Browser helpers: drive the current interview UI as a visitor would. ----

/** Set a React-controlled textarea/input and fire the input event React listens for. */
async function fillField(page, selector, value) {
  await page.waitForSelector(selector);
  await page.$eval(selector, (el, v) => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function clickButton(page, label) {
  const button = await page.waitForSelector(`button::-p-text(${label})`, { visible: true });
  await button.click();
}

async function waitForPath(page, path) {
  await page.waitForFunction((p) => window.location.pathname.startsWith(p), { timeout: 15000 }, path);
}

/**
 * Public journey through the current interview:
 * /remember (narrative) -> /remember/write -> /remember/details -> /remember/final -> /thanks.
 * Each submission uses a fresh tab so the session-stored draft starts empty.
 */
async function submitPublicMemory(browser, { memoryText, aboutYou, eventName, mediaLink, attribution, finalNotes }) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${base}/remember`, { waitUntil: "networkidle0", timeout: 30000 });

    // Narrative CTA leads into the interview.
    const cta = await page.waitForSelector('a[href="/remember/write"]', { timeout: 15000 });
    assert.match(await cta.evaluate((a) => a.textContent.trim()), /LET'S REMEMBER/i, "intro CTA should be the interview entry");
    await page.evaluate(() => document.querySelector('a[href="/remember/write"]').click());
    await waitForPath(page, "/remember/write");

    // Step 2: an empty memory is refused with a visible message and no navigation.
    await clickButton(page, "Keep Going");
    await page.waitForFunction(() => document.querySelector(".error-note")?.textContent.includes("Please share your memory"), { timeout: 5000 });
    assert.ok(page.url().endsWith("/remember/write"), "empty memory must stay on the write step");

    // About you: the name and email are captured on the write step, before the memory is sent.
    if (aboutYou?.name) await fillField(page, "#submitterName", aboutYou.name);
    if (aboutYou?.contact) await fillField(page, "#contact", aboutYou.contact);
    await fillField(page, 'textarea[name="memoryText"]', memoryText);
    await clickButton(page, "Keep Going");
    await waitForPath(page, "/remember/details");

    // Step 3: optional details. A media link reveals the consent checkbox.
    if (eventName) await fillField(page, 'input[name="eventName"]', eventName);
    if (mediaLink) {
      await fillField(page, 'input[name="mediaLink"]', mediaLink);
      // Select the consent box by its label, not by position (the first checkline is "approximate date").
      await page.waitForFunction(() => [...document.querySelectorAll("label.checkline")].some((l) => l.textContent.includes("use this in the book")));
      await page.evaluate(() => [...document.querySelectorAll("label.checkline")].find((l) => l.textContent.includes("use this in the book")).querySelector("input").click());
    }
    await clickButton(page, "One Last Thing");
    await waitForPath(page, "/remember/final");

    // Step 4: attribution preference and final notes, then send.
    const submissionId = new URL(page.url()).searchParams.get("submissionId");
    assert.ok(submissionId, "final step should carry the submission ID");
    // The contributor capability cookie is issued for this submission: HttpOnly, strict, and scoped to /remember.
    const issued = (await page.cookies()).find((c) => c.name === `m3_contrib_${submissionId}`);
    assert.ok(issued, "capability cookie is issued for this submission");
    assert.equal(issued.httpOnly, true, "capability cookie is HttpOnly");
    assert.equal(issued.path, "/remember", "capability cookie is scoped to /remember");
    assert.equal(issued.sameSite, "Strict", "capability cookie is SameSite=Strict");
    // The name is no longer asked for on the final step; it was captured earlier.
    assert.equal(await page.$("#submitterName"), null, "final step must not ask for the name again");
    if (attribution) {
      const option = await page.waitForSelector(`input[name="attributionPreference"][value="${attribution}"]`, { visible: true });
      await option.click();
    }
    if (finalNotes) await fillField(page, "#finalNotes", finalNotes);
    await clickButton(page, "Send My Memory");
    await waitForPath(page, "/thanks");
    // The capability is spent on save, and the cookie is cleared in the same response.
    assert.equal((await page.cookies()).find((c) => c.name === `m3_contrib_${submissionId}`), undefined, "capability cookie is cleared after the save");

    // The confirmation page must not echo the memory or the submission ID.
    const thanksHtml = await page.content();
    assert.doesNotMatch(thanksHtml, new RegExp(submissionId));
    assert.doesNotMatch(thanksHtml, /Fictional/);
    return submissionId;
  } finally {
    await page.close();
  }
}

try {
  await waitForServer();

  // Entry: /remember is served as the cinematic intro with its title.
  const rememberRes = await fetch(`${base}/remember`);
  assert.equal(rememberRes.status, 200, "/remember should be served");
  assert.match(await rememberRes.text(), /<title>Remember \| M3 Memory<\/title>/, "/remember should carry its page title");

  const browser = await puppeteer.launch({ headless: true });
  let longSubmissionId;
  try {
    // Submission 1: long memory (exceeds the 12,000-char persistence cap) with an event name.
    const longMemory = `Fictional long memory ${"x".repeat(13000)}`;
    longSubmissionId = await submitPublicMemory(browser, {
      memoryText: longMemory,
      aboutYou: { name: "Fictional Contributor", contact: "fictional@example.test" },
      eventName: "Imaginary Lantern Night",
      mediaLink: "https://example.com/fictional-photo",
      attribution: "first_name",
      finalNotes: "Fictional final note."
    });

    // Submission 2: only the required memory, all optional fields omitted.
    await submitPublicMemory(browser, { memoryText: "Fictional optional-fields-omitted memory." });
  } finally {
    await browser.close();
  }

  const db = new DatabaseSync(dbPath);
  const submissions = db.prepare("SELECT id, status, original_json, attribution_preference, media_consent, final_notes FROM submissions ORDER BY created_at ASC").all();
  assert.equal(submissions.length, 2, "two public submissions should be stored");
  assert.equal(submissions[0].id, longSubmissionId, "first stored submission is the long memory");
  assert.equal(submissions[0].status, "UNREVIEWED");
  const originalBefore = JSON.parse(submissions[0].original_json);
  assert.equal(originalBefore.memoryText.length, 12000, "long memory is capped at persistence boundary");
  assert.ok(originalBefore.memoryText.startsWith("Fictional long memory"), "stored memory is the submitted text");
  assert.equal(originalBefore.eventName, "Imaginary Lantern Night", "optional event name is stored from the details step");
  assert.equal(JSON.parse(submissions[1].original_json).eventName, "", "omitted optional fields are stored as empty source fields");
  assert.equal(JSON.parse(submissions[1].original_json).memoryText, "Fictional optional-fields-omitted memory.");

  // About you persists at creation: the name and email reach the original record and the person row.
  assert.equal(JSON.parse(submissions[0].original_json).submitterName, "Fictional Contributor", "name captured on the write step is stored");
  const people = db.prepare("SELECT s.original_json, p.display_name, p.contact FROM submissions s JOIN persons p ON p.id = s.submitter_person_id ORDER BY s.created_at ASC").all();
  assert.equal(people[0].display_name, "Fictional Contributor", "name is stored on the person row");
  assert.equal(people[0].contact, "fictional@example.test", "email is stored on the person row");
  assert.equal(JSON.parse(people[1].original_json).submitterName, "Anonymous", "omitted name still falls back to Anonymous");

  // Every capability issued during the interview was consumed by its save: no live capability remains.
  assert.equal(db.prepare("SELECT count(*) AS n FROM contributor_capabilities").get().n, 0, "every capability is consumed by its save");

  // The final step persists the attribution choice and notes; the default path stays anonymous.
  assert.equal(submissions[0].attribution_preference, "first_name", "final step saves a non-default attribution choice");
  assert.equal(submissions[0].final_notes, "Fictional final note.", "final step saves the final notes");
  assert.equal(submissions[1].attribution_preference, "anonymous", "default attribution is anonymous");
  // Consent is captured from the details step, only when a media link is given.
  assert.equal(submissions[0].media_consent, 1, "media consent persists from the details step");
  assert.equal(submissions[1].media_consent, 0, "no consent is recorded without media");
  assert.equal(JSON.parse(submissions[0].original_json).mediaLink, "https://example.com/fictional-photo", "media link is part of the original record");

  const publicAdminList = await fetch(`${base}/admin/submissions`, { redirect: "manual" });
  assert.equal(publicAdminList.status, 307, "public cannot list submissions");
  assert.equal(publicAdminList.headers.get("location"), "/admin/login");

  const publicDetail = await fetch(`${base}/admin/submissions/${submissions[0].id}`, { redirect: "manual" });
  assert.equal(publicDetail.status, 307, "public cannot read arbitrary submissions");
  assert.equal(publicDetail.headers.get("location"), "/admin/login");

  const loginHtml = await (await fetch(`${base}/admin/login`)).text();
  const login = await postForm("/admin/login", { ...actionFields(loginHtml), password: adminPassword });
  assert.equal(login.status, 303, "authorized admin login redirects");
  assert.equal(login.headers.get("location"), "/admin/submissions");
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "login sets session cookie");

  const inbox = await fetch(`${base}/admin/submissions`, { headers: { cookie } });
  assert.equal(inbox.status, 200, "authorized admin can access inbox");
  const inboxHtml = await inbox.text();
  assert.match(inboxHtml, /Imaginary Lantern Night|Fictional long memory/);

  const detail = await fetch(`${base}/admin/submissions/${submissions[0].id}`, { headers: { cookie } });
  assert.equal(detail.status, 200, "authorized admin can read detail");
  const detailHtml = await detail.text();
  assert.match(detailHtml, /Contributor Original/);
  assert.match(detailHtml, /Yeriel Review/);

  const save = await postForm(`/admin/submissions/${submissions[0].id}`, {
    ...actionFields(detailHtml),
    status: "APPROVED_FOR_STORY",
    notes: "Fictional review note.",
    remembered: "Fictional remembered layer.",
    corrections: "Fictional correction layer, separate from original.",
    context: "Fictional context.",
    people: "Fictional River, Yeriel",
    tags: "fictional,smoke",
    importance: "4",
    emotionalSignificance: "3",
    historicalSignificance: "2",
    accuracyConfidence: "4",
    bookPotential: "5",
    chapterCategory: "fictional",
    privateNotes: "Fictional private note."
  }, cookie);
  assert.equal(save.status, 303, "review creation redirects back to detail");

  const afterCreate = db.prepare("SELECT s.status, s.original_json, r.notes, r.book_potential FROM submissions s LEFT JOIN reviews r ON r.submission_id = s.id WHERE s.id = ?").get(submissions[0].id);
  assert.equal(afterCreate.status, "APPROVED_FOR_STORY");
  assert.equal(afterCreate.original_json, submissions[0].original_json, "original source unchanged after review create");
  assert.equal(afterCreate.notes, "Fictional review note.");
  assert.equal(afterCreate.book_potential, 5);

  const detail2 = await (await fetch(`${base}/admin/submissions/${submissions[0].id}`, { headers: { cookie } })).text();
  const update = await postForm(`/admin/submissions/${submissions[0].id}`, {
    ...actionFields(detail2),
    status: "REVIEWED",
    notes: "Fictional updated review note.",
    remembered: "Fictional remembered layer updated.",
    corrections: "Still separate.",
    context: "Updated fictional context.",
    people: "Fictional River",
    tags: "fictional,updated",
    importance: "1",
    emotionalSignificance: "1",
    historicalSignificance: "1",
    accuracyConfidence: "3",
    bookPotential: "2",
    chapterCategory: "updated-fictional",
    privateNotes: "Updated private note."
  }, cookie);
  assert.equal(update.status, 303, "review update redirects back to detail");

  const afterUpdate = db.prepare("SELECT s.status, s.original_json, r.notes, r.book_potential, (SELECT count(*) FROM reviews WHERE submission_id = s.id) AS review_count FROM submissions s LEFT JOIN reviews r ON r.submission_id = s.id WHERE s.id = ?").get(submissions[0].id);
  assert.equal(afterUpdate.status, "REVIEWED");
  assert.equal(afterUpdate.review_count, 1, "review update keeps one separate review row");
  assert.equal(afterUpdate.original_json, submissions[0].original_json, "original source unchanged after review update");
  assert.equal(afterUpdate.notes, "Fictional updated review note.");
  assert.equal(afterUpdate.book_potential, 2);

  const thanks = await fetch(`${base}/thanks`);
  assert.equal(thanks.status, 200);
  const thanksHtml = await thanks.text();
  assert.doesNotMatch(thanksHtml, new RegExp(submissions[0].id));
  assert.doesNotMatch(thanksHtml, /Fictional River/);

  console.log("v01 smoke ok");
} finally {
  if (process.platform === "win32" && child.pid) {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } catch {}
  } else {
    child.kill();
  }
}
