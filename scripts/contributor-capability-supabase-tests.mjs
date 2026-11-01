import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Request-shape tests for the Supabase contributor-capability store, against a fake fetch. No network.
// Also checks that the schema grants nothing to anon or authenticated on the new table.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fictional-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fictional-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fictional-service-role-key";
process.env.M3_PERSISTENCE = "supabase";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[cm]?[jt]s$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const supa = await import(pathToFileURL(join(root, "src/lib/supabase.ts")).href);

const SID = "3f2c1b8e-7a4d-4c9e-9b1a-5d6e7f8a9b0c";
const PID = "8a7b6c5d-4e3f-4a2b-8c1d-9e0f1a2b3c4d";
const HASH = "a".repeat(64);
const NOW = "2026-10-31T12:00:00.000Z";
const SERVICE = "fictional-service-role-key";
const ANON = "fictional-anon-key";

function fakeFetch(responder) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : undefined });
    const reply = responder(calls.length - 1, String(url), init);
    return new Response(reply.body === undefined ? "" : JSON.stringify(reply.body), { status: reply.status ?? 200 });
  };
  return { fn, calls };
}

const ok = (body) => ({ status: 200, body });

// 1. Issue: one POST, service role only, exactly three columns.
{
  const { fn, calls } = fakeFetch(() => ok([]));
  await supa.insertSupabaseCapability(SID, HASH, NOW, fn);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/rest\/v1\/contributor_capabilities$/);
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["expires_at", "submission_id", "token_hash"]);
  assert.equal(calls[0].headers.apikey, SERVICE);
  assert.equal(calls[0].headers.authorization, `Bearer ${SERVICE}`);
}

// 2. Consume: DELETE with every predicate; exactly one returned row with the same id is success.
{
  const { fn, calls } = fakeFetch(() => ok([{ submission_id: SID }]));
  assert.equal(await supa.consumeSupabaseCapability(SID, HASH, NOW, fn), true);
  const u = new URL(calls[0].url);
  assert.equal(calls[0].method, "DELETE");
  assert.equal(u.searchParams.get("submission_id"), `eq.${SID}`);
  assert.equal(u.searchParams.get("token_hash"), `eq.${HASH}`);
  assert.equal(u.searchParams.get("expires_at"), `gt.${NOW}`);
  assert.equal(calls[0].headers.prefer, "return=representation");
  assert.equal(calls[0].headers.authorization, `Bearer ${SERVICE}`);
}
// Consume failure shapes: zero rows, two rows, a different id. None is success.
for (const body of [[], [{ submission_id: SID }, { submission_id: SID }], [{ submission_id: PID }], {}]) {
  const { fn } = fakeFetch(() => ok(body));
  assert.equal(await supa.consumeSupabaseCapability(SID, HASH, NOW, fn), false, `consume rejects ${JSON.stringify(body)}`);
}

// 3. Save: PATCH guarded by id and status; body is exactly the four columns; one returned row with the same id.
{
  const { fn, calls } = fakeFetch(() => ok([{ id: SID }]));
  const fields = { attributionPreference: "first_name", preferredAttribution: null, bookNote: "n", finalNotes: "f" };
  assert.equal(await supa.saveSupabaseContributorPreferences(SID, fields, fn), true);
  const u = new URL(calls[0].url);
  assert.equal(calls[0].method, "PATCH");
  assert.equal(u.searchParams.get("id"), `eq.${SID}`);
  assert.equal(u.searchParams.get("status"), "eq.UNREVIEWED");
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["attribution_preference", "book_note", "final_notes", "preferred_attribution"]);
  assert.equal(calls[0].headers.authorization, `Bearer ${SERVICE}`);
}
// A reviewed submission matches zero rows: refused. A wrong id is refused too.
for (const body of [[], [{ id: SID }, { id: SID }], [{ id: PID }]]) {
  const { fn } = fakeFetch(() => ok(body));
  const fields = { attributionPreference: "anonymous", preferredAttribution: null, bookNote: null, finalNotes: null };
  assert.equal(await supa.saveSupabaseContributorPreferences(SID, fields, fn), false, `save rejects ${JSON.stringify(body)}`);
}

// 4. Compensation: three keyed deletes, in order, all with the service role.
{
  const { fn, calls } = fakeFetch(() => ok([]));
  await supa.deleteSupabaseSubmissionRecords(SID, PID, fn);
  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /contributor_capabilities\?submission_id=eq\./);
  assert.match(calls[1].url, /submissions\?id=eq\./);
  assert.match(calls[2].url, /persons\?id=eq\./);
  for (const c of calls) {
    assert.equal(c.method, "DELETE");
    assert.equal(c.headers.authorization, `Bearer ${SERVICE}`);
  }
}

// 5. Injection: ids are percent-encoded into the filter, so a hostile value cannot add a filter.
{
  const { fn, calls } = fakeFetch(() => ok([]));
  await supa.consumeSupabaseCapability("x&status=eq.REVIEWED", HASH, NOW, fn).catch(() => {});
  assert.ok(!calls[0].url.includes("&status="), "an id cannot inject a filter");
  assert.ok(calls[0].url.includes(encodeURIComponent("x&status=eq.REVIEWED")));
}

// 6. Fail closed: a missing service-role key throws before any request.
{
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";
  const { fn, calls } = fakeFetch(() => ok([]));
  await assert.rejects(() => supa.consumeSupabaseCapability(SID, HASH, NOW, fn));
  assert.equal(calls.length, 0, "no request is sent without the service-role key");
  process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
}

// 7. Only the service key is ever sent by these helpers (the anon key never appears in any call).
{
  const { fn, calls } = fakeFetch(() => ok([{ submission_id: SID }]));
  await supa.consumeSupabaseCapability(SID, HASH, NOW, fn);
  for (const c of calls) assert.notEqual(c.headers.authorization, `Bearer ${ANON}`);
}

// 8. Schema: the new table is RLS-enabled, revoked from anon and authenticated, has no policy, and the cleanup
// function is not executable by application roles.
{
  const sql = readFileSync(join(root, "supabase/schema.sql"), "utf8");
  const block = sql.slice(sql.indexOf("create table if not exists public.contributor_capabilities"));
  assert.match(sql, /alter table public\.contributor_capabilities enable row level security;/);
  assert.match(sql, /revoke all on public\.contributor_capabilities from anon, authenticated;/);
  assert.doesNotMatch(sql, /create policy [a-z_]+ on public\.contributor_capabilities/, "no policy on the capability table");
  assert.doesNotMatch(sql, /^\s*grant\b.*contributor_capabilities/im, "no grant statement on the capability table");
  assert.match(sql, /revoke all on function public\.contributor_purge_expired\(\) from public, anon, authenticated;/);
  assert.match(block, /security definer/, "cleanup runs as definer");
  assert.doesNotMatch(sql, /grant[^;]*submissions[^;]*to anon/i, "submissions is not granted to anon");
}

console.log("contributor capability supabase tests ok");
