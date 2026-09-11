import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { DatabaseSync } from "node:sqlite";

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

function form(fields, files = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  for (const [key, file] of Object.entries(files)) body.append(key, file);
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

try {
  await waitForServer();

  // Act I: Scroll experience at /remember
  const rememberPageHtml = await (await fetch(`${base}/remember`)).text();
  assert.match(rememberPageHtml, /Crossing Paths|Enter the Memory/i, "Act I scroll narrative should be present");

  // Act II: Form at /remember/write
  const writeHtml = await (await fetch(`${base}/remember/write`)).text();
  assert.match(writeHtml, /Your Memory|The Memory/i, "Act II form should be present");

  const missing = await postForm("/remember/write", actionFields(writeHtml));
  assert.equal(missing.status, 303, "missing required fields should redirect");
  assert.equal(missing.headers.get("location"), "/remember/write?error=missing");

  const longMemory = `Fictional long memory ${"x".repeat(13000)}`;
  const writeFormData = actionFields(writeHtml);
  writeFormData.submitterName = "Fictional River";
  writeFormData.memoryText = longMemory;
  writeFormData.eventName = "Imaginary Lantern Night";

  const submit = await postForm("/remember/write", writeFormData);
  assert.equal(submit.status, 303, "valid Act II submission should redirect to Act III");
  const finalRedirect = submit.headers.get("location");
  assert.match(finalRedirect, /\/remember\/final\?submissionId=/, "should redirect to Act III with submission ID");

  const optionalSubmit = await postForm("/remember/write", {
    ...actionFields(await (await fetch(`${base}/remember/write`)).text()),
    submitterName: "",
    memoryText: "Fictional optional-fields-omitted memory."
  });
  assert.equal(optionalSubmit.status, 303, "optional fields (including name) may be omitted");
  assert.match(optionalSubmit.headers.get("location"), /\/remember\/final\?submissionId=/, "empty name should still redirect to Act III");

  // Test media upload: create a tiny 1x1 PNG (89 bytes minimum, created in-memory)
  const pngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  const mediaFile = new File([pngBytes], "test-memory-image.png", {
    type: "image/png"
  });

  const writeFormForMedia = actionFields(await (await fetch(`${base}/remember/write`)).text());
  const mediaSubmit = await fetch(`${base}/remember/write`, {
    method: "POST",
    body: (() => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(writeFormForMedia)) {
        formData.set(key, value);
      }
      formData.set("submitterName", "Fictional Media Test");
      formData.set("memoryText", "Memory with a small test image attached");
      formData.set("mediaConsent", "on");
      formData.append("media", mediaFile);
      return formData;
    })(),
    redirect: "manual"
  });
  assert.equal(mediaSubmit.status, 303, "submission with media should redirect to Act III");
  assert.match(mediaSubmit.headers.get("location"), /\/remember\/final\?submissionId=/, "media submission should redirect to Act III");

  const db = new DatabaseSync(dbPath);
  const submissions = db.prepare("SELECT id, status, original_json, media_consent, attribution_preference, preferred_attribution, book_note, final_notes FROM submissions ORDER BY created_at ASC").all();
  assert.equal(submissions.length, 3);
  assert.equal(submissions[0].status, "UNREVIEWED");
  const originalBefore = JSON.parse(submissions[0].original_json);
  assert.equal(originalBefore.submitterName, "Fictional River");
  assert.equal(originalBefore.memoryText.length, 12000, "long memory is capped at persistence boundary");
  assert.equal(JSON.parse(submissions[1].original_json).eventName, "", "optional fields omitted are stored as empty source fields");

  // Verify Act III preference fields exist (initially null except attribution_preference defaults to 'anonymous')
  assert.equal(submissions[0].attribution_preference, "anonymous", "attribution_preference defaults to anonymous");
  assert.equal(submissions[0].preferred_attribution, null, "preferred_attribution is initially null");
  assert.equal(submissions[0].book_note, null, "book_note is initially null");
  assert.equal(submissions[0].final_notes, null, "final_notes is initially null");

  // Verify media upload test submission
  assert.equal(submissions[2].media_consent, 1, "mediaConsent persists");
  const mediaSubmissionId = submissions[2].id;
  const mediaRows = db.prepare("SELECT id, file_name, mime_type FROM media WHERE submission_id = ?").all(mediaSubmissionId);
  assert.equal(mediaRows.length, 1, "one media row created for submission");
  assert.equal(mediaRows[0].file_name, "test-memory-image.png");
  assert.equal(mediaRows[0].mime_type, "image/png");

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
  assert.match(inboxHtml, /Fictional River/);
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


