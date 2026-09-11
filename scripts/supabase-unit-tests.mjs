import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";

const originalEnv = { ...process.env };
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fictional-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fictional-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-placeholder";
process.env.M3_PERSISTENCE = "supabase";
process.env.M3_ADMIN_AUTH = "supabase";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});

const supabase = await import("../src/lib/supabase.ts");

function restoreEnv() {
  process.env = { ...originalEnv };
}

function response(body, status = 200) {
  return new Response(body === undefined ? "" : JSON.stringify(body), { status });
}

function makeFetch(replies = []) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = replies.shift();
    if (!next) return response([]);
    if (typeof next === "function") return next(url, init, calls.length - 1);
    return response(next.body, next.status || 200);
  };
  fn.calls = calls;
  return fn;
}

{
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.M3_PERSISTENCE;
  assert.equal(supabase.getPersistenceMode(), "sqlite");
  process.env.M3_PERSISTENCE = "supabase";
  assert.throws(() => supabase.getSupabaseConfig(true), /SUPABASE_MISCONFIGURED/);
}

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fictional-project.supabase.co/";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fictional-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-placeholder";
process.env.M3_PERSISTENCE = "supabase";
process.env.M3_ADMIN_AUTH = "supabase";

{
  process.env.M3_ADMIN_AUTH = "local";
  assert.throws(() => supabase.requireCompatibleAuthMode(), /SUPABASE_MISCONFIGURED/);
  process.env.M3_ADMIN_AUTH = "supabase";
}

{
  const fetchMock = makeFetch([{ status: 201 }, { status: 201 }]);
  await supabase.createSupabaseSubmission({
    id: "00000000-0000-4000-8000-000000000001",
    personId: "00000000-0000-4000-8000-000000000002",
    original: {
      submitterName: "Fictional Admin Test",
      contact: "fictional@example.test",
      encounterDate: "2026-01-01",
      isApproximateDate: true,
      locationName: "Fictional Hall",
      city: "Imaginary City",
      region: "Dream State",
      country: "Nowhere",
      eventName: "Fictional Supabase Night",
      howMet: "Fictional meeting context",
      memoryText: "A fictional Supabase memory.",
      beforeText: "Fictional before",
      afterText: "Fictional after",
      metAgain: "Fictional repeat",
      peoplePresent: "Fictional people",
      yerielWearing: "Fictional jacket",
      submitterWearing: "Fictional hat",
      talkedAbout: "Fictional conversation",
      exchanged: "Fictional sticker",
      artifactInfo: "Fictional artifact",
      forgottenPrompt: "Fictional forgotten detail",
      bookPagePrompt: "Fictional page prompt",
      additionalComments: "Fictional comments"
    },
    memoryPreview: "A fictional Supabase memory.",
    encounterDate: null,
    isApproximateDate: false,
    locationName: null,
    city: null,
    region: null,
    country: null,
    eventName: null,
    createdAt: "2026-09-10T00:00:00.000Z"
  }, fetchMock);

  assert.equal(fetchMock.calls.length, 2);
  assert.match(fetchMock.calls[0].url, /\/rest\/v1\/persons$/);
  assert.match(fetchMock.calls[1].url, /\/rest\/v1\/submissions$/);
  assert.equal(fetchMock.calls[0].init.headers.authorization, "Bearer test-service-role-placeholder");
  const submissionBody = JSON.parse(fetchMock.calls[1].init.body);
  assert.equal(typeof submissionBody.original_json, "object", "Supabase JSONB receives a raw object");
  assert.equal(submissionBody.original_json.submitterName, "Fictional Admin Test");
}

{
  const fetchMock = makeFetch([
    { body: { access_token: "user-token", user: { id: "user-id", email: "person@example.com" } } },
    { body: [] }
  ]);
  const session = await supabase.supabasePasswordLogin("person@example.com", "pw", fetchMock);
  assert.equal(session.accessToken, "user-token");
  assert.equal(await supabase.isSupabaseAdmin(session.accessToken, fetchMock), false, "non-allowlisted users are rejected");
}

{
  const fetchMock = makeFetch([{ body: [{ id: "allowlisted-admin" }] }]);
  assert.equal(await supabase.isSupabaseAdmin("admin-user-jwt", fetchMock), true, "allowlisted users are accepted");
}
{
  const fetchMock = makeFetch([{ body: [] }, { status: 200 }, { status: 200 }]);
  await supabase.upsertSupabaseReview("00000000-0000-4000-8000-000000000003", {
    status: "REVIEWED",
    notes: "Fictional review",
    remembered: null,
    corrections: null,
    context: null,
    people: null,
    tags: null,
    importance: null,
    emotional_significance: null,
    historical_significance: null,
    accuracy_confidence: null,
    book_potential: null,
    chapter_category: null,
    private_notes: null,
    updated_at: "2026-09-10T00:00:00.000Z"
  }, "admin-user-jwt", fetchMock);

  assert.equal(fetchMock.calls.every((call) => call.init.headers.authorization === "Bearer admin-user-jwt"), true);
  const bodies = fetchMock.calls.map((call) => call.init.body && JSON.parse(call.init.body)).filter(Boolean);
  assert.equal(bodies.some((body) => Object.hasOwn(body, "original_json")), false, "review/status writes never send original_json");
  assert.deepEqual(bodies.at(-1), { status: "REVIEWED", updated_at: "2026-09-10T00:00:00.000Z" });
}

{
  const fetchMock = makeFetch([
    { body: [{ id: "existing-review" }] },
    { status: 200 },
    { status: 200 }
  ]);
  await supabase.upsertSupabaseReview("00000000-0000-4000-8000-000000000003", {
    status: "REVIEWED",
    notes: "Updated fictional review",
    remembered: null,
    corrections: null,
    context: null,
    people: null,
    tags: null,
    importance: null,
    emotional_significance: null,
    historical_significance: null,
    accuracy_confidence: null,
    book_potential: null,
    chapter_category: null,
    private_notes: null,
    updated_at: "2026-09-10T00:00:00.000Z"
  }, "admin-user-jwt", fetchMock);

  const reviewPatchBody = JSON.parse(fetchMock.calls[1].init.body);
  assert.equal(Object.hasOwn(reviewPatchBody, "submission_id"), false, "review updates do not patch immutable foreign key");
}

{
  const schema = readFileSync("supabase/schema.sql", "utf8");
  assert.match(schema, /create table if not exists public\.m3_admins/);
  assert.match(schema, /lower\(email\) = lower\(auth\.jwt\(\)->>'email'\)/);
  assert.match(schema, /grant update\(status, updated_at\) on public\.submissions to authenticated;/);
  assert.doesNotMatch(schema, /for select to anon/i);
  for (const policy of [
    "admin_read_allowlist",
    "admin_read_persons",
    "admin_read_submissions",
    "admin_update_submission_status",
    "admin_read_reviews",
    "admin_insert_reviews",
    "admin_update_reviews"
  ]) {
    assert.match(schema, new RegExp(`create policy ${policy}`));
  }
}

function walk(dir, found = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return found;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

for (const path of walk(".next/static")) {
  const content = readFileSync(path, "utf8");
  assert.doesNotMatch(content, /SUPABASE_SERVICE_ROLE_KEY|test-service-role-placeholder/);
}

{
  const schema = readFileSync("supabase/schema.sql", "utf8");

  // Test: media table RLS policies exist
  assert.match(schema, /create table if not exists public\.media/i, "media table defined");
  assert.match(schema, /create policy admin_read_media/i, "media RLS policy for admins exists");
  assert.match(schema, /admin_read_media[\s\S]{0,200}is_m3_admin/i, "media RLS uses admin check");

  // Test: mediaLink and mediaConsent are separate fields, not in original_json
  assert.match(schema, /create table if not exists public\.submissions/);
  assert.match(schema, /media_link.*text/i, "media_link column exists");
  assert.match(schema, /media_consent.*boolean/i, "media_consent column exists");
}

restoreEnv();
console.log("supabase unit/security tests ok (including media schema & RLS)");
