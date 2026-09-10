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
  env: { ...process.env, DATABASE_PATH: dbPath, ADMIN_PASSWORD: adminPassword, SESSION_SECRET: sessionSecret },
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

try {
  await waitForServer();

  const rememberHtml = await (await fetch(`${base}/remember`)).text();
  assert.match(rememberHtml, /Tell me the part only you remember/);

  const missing = await postForm("/remember", actionFields(rememberHtml));
  assert.equal(missing.status, 303, "missing required fields should redirect");
  assert.equal(missing.headers.get("location"), "/remember?error=missing");

  const longMemory = `Fictional long memory ${"x".repeat(13000)}`;
  const submit = await postForm("/remember", {
    ...actionFields(rememberHtml),
    submitterName: "Fictional River",
    memoryText: longMemory,
    eventName: "Imaginary Lantern Night"
  });
  assert.equal(submit.status, 303, "valid submission should redirect");
  assert.equal(submit.headers.get("location"), "/thanks");

  const optionalSubmit = await postForm("/remember", {
    ...actionFields(await (await fetch(`${base}/remember`)).text()),
    submitterName: "Fictional Sol",
    memoryText: "Fictional optional-fields-omitted memory."
  });
  assert.equal(optionalSubmit.status, 303, "optional fields may be omitted");

  const db = new DatabaseSync(dbPath);
  const submissions = db.prepare("SELECT id, status, original_json FROM submissions ORDER BY created_at ASC").all();
  assert.equal(submissions.length, 2);
  assert.equal(submissions[0].status, "UNREVIEWED");
  const originalBefore = JSON.parse(submissions[0].original_json);
  assert.equal(originalBefore.submitterName, "Fictional River");
  assert.equal(originalBefore.memoryText.length, 12000, "long memory is capped at persistence boundary");
  assert.equal(JSON.parse(submissions[1].original_json).eventName, "", "optional fields omitted are stored as empty source fields");

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


