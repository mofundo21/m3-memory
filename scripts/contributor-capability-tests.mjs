import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Pure and local-store tests for the contributor write capability (Design v3, final review PASS WITH REQUIRED CHANGES).
const workDir = mkdtempSync(join(tmpdir(), "m3-capability-"));
process.env.M3_PERSISTENCE = "sqlite";
process.env.M3_ADMIN_AUTH = "local";
process.env.DATABASE_PATH = join(workDir, "capability.sqlite");
process.env.SESSION_SECRET = "fictional-capability-session-secret";
process.env.NODE_ENV = "test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    // The app's lib files import siblings without an extension; strip-types needs the .ts file name.
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[cm]?[jt]s$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const cap = await import("../src/lib/contributorCapability.ts");
const db = await import("../src/lib/db.ts");

const SID = "3f2c1b8e-7a4d-4c9e-9b1a-5d6e7f8a9b0c";
const OTHER = "8a7b6c5d-4e3f-4a2b-8c1d-9e0f1a2b3c4d";
const prefs = { attributionPreference: "anonymous", preferredAttribution: null, bookNote: null, finalNotes: null };
const now = new Date("2026-10-31T12:00:00Z");

/** A minimal, valid submission. Each call creates a new submission and a new person row. */
function makeSubmission(label) {
  return db.createSubmission({
    submitterName: "Fictional Tester", contact: "", encounterDate: "", isApproximateDate: false, locationName: "",
    city: "", region: "", country: "", eventName: "", howMet: "", memoryText: `Fictional memory for ${label}.`,
    beforeText: "", afterText: "", metAgain: "", peoplePresent: "", yerielWearing: "", submitterWearing: "",
    talkedAbout: "", exchanged: "", artifactInfo: "", forgottenPrompt: "", bookPagePrompt: "", additionalComments: "",
    mediaLink: "", mediaConsent: false,
  });
}

try {
  // 1. Token: 256 bits from the CSPRNG, unpadded base64url, exactly 43 characters, unique.
  const tokens = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const t = cap.generateToken();
    assert.equal(t.length, 43, "token is 43 characters");
    assert.match(t, /^[A-Za-z0-9_-]{43}$/, "token is unpadded base64url");
    tokens.add(t);
  }
  assert.equal(tokens.size, 2000, "tokens do not repeat");

  // 2. Hash: SHA-256 hex; never the raw token.
  const sample = cap.generateToken();
  assert.match(cap.hashToken(sample), /^[0-9a-f]{64}$/, "stored value is SHA-256 hex");
  assert.notEqual(cap.hashToken(sample), sample, "stored value is not the token");

  // 3. Cookie value: exactly <uuid>.<43 chars>. Every malformed shape is rejected without throwing.
  const good = cap.formatCookieValue(SID, sample);
  assert.deepEqual(cap.parseCookieValue(good), { submissionId: SID, token: sample }, "well-formed value parses");
  const malformed = [
    undefined, null, "", "x", good + "x", good.slice(0, -1), good.replace(".", "_"), `${SID}..${sample}`,
    good.replace(SID, SID.toUpperCase()), good.replace(SID, "not-a-uuid-value-here-xxxxxxxxxxxxxx"),
    `${SID}.${"+".repeat(43)}`, `${SID}.${"a".repeat(42)}`, `${SID}.${"a".repeat(44)}`, `${SID}.${sample}.extra`,
  ];
  for (const value of malformed) {
    assert.equal(cap.parseCookieValue(value), null, `rejects ${JSON.stringify(value)}`);
  }

  // 4. Cookie name is derived only from a canonical id.
  assert.equal(cap.cookieNameFor(SID), `m3_contrib_${SID}`);
  assert.throws(() => cap.cookieNameFor("../../etc"), /INVALID_SUBMISSION_ID/, "cookie name rejects path-like input");

  // 5. Cookie attributes: httpOnly, strict, scoped to /remember, two-hour lifetime; deletion keeps the same path.
  const opts = cap.cookieOptions();
  assert.equal(opts.httpOnly, true);
  assert.equal(opts.sameSite, "strict");
  assert.equal(opts.path, "/remember");
  assert.equal(opts.maxAge, 7200);
  assert.equal(cap.cookieOptions(0).path, "/remember", "deletion uses the same path");
  assert.equal(cap.cookieOptions(0).maxAge, 0);
  assert.equal(cap.cookieOptions(0).expires.getTime(), 0, "deletion carries an epoch expiry");
  assert.equal(cap.cookieOptions().expires, undefined, "issuance has no explicit expiry, only maxAge");
  assert.equal(cap.cookieOptions(0).httpOnly, true, "deletion keeps HttpOnly");
  assert.equal(cap.cookieOptions(0).sameSite, "strict", "deletion keeps SameSite");

  // 6. Allowlist: only the four fields survive; unknown choices become anonymous; text is capped.
  const dirty = cap.sanitizePreferences({
    attributionPreference: "admin_override",
    preferredAttribution: "x".repeat(300),
    bookNote: "  note  ",
    finalNotes: "",
    status: "APPROVED_FOR_STORY",
    original_json: "{}",
    submitter_person_id: OTHER,
    reviewer: "someone",
  });
  assert.deepEqual(Object.keys(dirty).sort(), ["attributionPreference", "bookNote", "finalNotes", "preferredAttribution"]);
  assert.equal(dirty.attributionPreference, "anonymous", "unknown attribution becomes anonymous");
  assert.equal(dirty.preferredAttribution.length, 240, "preferred attribution is capped");
  assert.equal(dirty.bookNote, "note", "book note is trimmed");
  assert.equal(dirty.finalNotes, null, "empty notes are null");
  assert.equal(cap.sanitizePreferences({ attributionPreference: "full_name" }).attributionPreference, "full_name");
  for (const choice of ["nickname", "artist_name", "initials", "custom"]) {
    assert.equal(cap.sanitizePreferences({ attributionPreference: choice }).attributionPreference, choice, choice + " is kept as chosen");
  }

  // 7. Binding: a valid capability for S cannot be redeemed for a different submission id. Rejected before any DB work.
  const tokenForSid = cap.generateToken();
  const redeemedForOther = await cap.redeemCapability(OTHER, cap.formatCookieValue(SID, tokenForSid), prefs, now);
  assert.equal(redeemedForOther, false, "cookie for S rejected for id O");
  assert.equal(await cap.redeemCapability(SID, undefined, prefs, now), false, "missing cookie rejected");

  // 8. Local store: issue, consume once, replay refused, save guarded by status, expiry enforced in the statement.
  const created = await db.createSubmission({
    submitterName: "Fictional Tester", contact: "", encounterDate: "", isApproximateDate: false, locationName: "",
    city: "", region: "", country: "", eventName: "", howMet: "", memoryText: "Fictional memory for capability tests.",
    beforeText: "", afterText: "", metAgain: "", peoplePresent: "", yerielWearing: "", submitterWearing: "",
    talkedAbout: "", exchanged: "", artifactInfo: "", forgottenPrompt: "", bookPagePrompt: "", additionalComments: "",
    mediaLink: "", mediaConsent: false,
  });
  assert.equal(typeof created.id, "string");
  assert.equal(typeof created.personId, "string");

  const token = await cap.issueCapability(created.id, now);
  const cookie = cap.formatCookieValue(created.id, token);
  assert.equal(await cap.redeemCapability(created.id, cookie, { ...prefs, finalNotes: "First save." }, now), true, "first redeem saves");
  assert.equal(await cap.redeemCapability(created.id, cookie, { ...prefs, finalNotes: "Replay." }, now), false, "replay refused");

  // Expiry: a capability past its expiry cannot be consumed, even with the right token.
  // One capability per submission (the table's primary key), so each case gets its own submission.
  const expiredSub = await makeSubmission("expired");
  const expiredToken = await cap.issueCapability(expiredSub.id, new Date("2020-01-01T00:00:00Z"));
  const later = new Date("2026-10-31T12:00:00Z");
  assert.equal(await cap.redeemCapability(expiredSub.id, cap.formatCookieValue(expiredSub.id, expiredToken), prefs, later), false, "expired capability refused");

  // Status gate: once reviewed, a live capability can no longer change preferences.
  const reviewedSub = await makeSubmission("reviewed");
  const reviewedToken = await cap.issueCapability(reviewedSub.id, now);
  const { DatabaseSync } = await import("node:sqlite");
  const raw = new DatabaseSync(process.env.DATABASE_PATH);
  raw.prepare("UPDATE submissions SET status = 'REVIEWED' WHERE id = ?").run(reviewedSub.id);
  assert.equal(await cap.redeemCapability(reviewedSub.id, cap.formatCookieValue(reviewedSub.id, reviewedToken), prefs, now), false, "reviewed submission refuses the save");

  // Stored value is the hash only: the raw token never appears in the table.
  // Consume-first: the reviewed case spent its capability before the status gate refused the save, so no row remains for it.
  assert.equal(raw.prepare("SELECT count(*) AS n FROM contributor_capabilities WHERE submission_id = ?").get(reviewedSub.id).n, 0, "reviewed case is consumed");
  // The expired case was refused before consumption, so its row remains until the cleanup removes it.
  const stored = raw.prepare("SELECT token_hash FROM contributor_capabilities WHERE submission_id = ?").all(expiredSub.id);
  assert.equal(stored.length, 1, "expired row remains for cleanup");
  for (const row of stored) {
    assert.match(row.token_hash, /^[0-9a-f]{64}$/);
    assert.notEqual(row.token_hash, reviewedToken);
    assert.notEqual(row.token_hash, expiredToken);
  }
  raw.close();

  // Compensation removes the submission and its capability and person rows.
  await db.deleteSubmissionRecords(created.id, created.personId);
  const after = new DatabaseSync(process.env.DATABASE_PATH);
  assert.equal(after.prepare("SELECT count(*) AS n FROM submissions WHERE id = ?").get(created.id).n, 0);
  assert.equal(after.prepare("SELECT count(*) AS n FROM contributor_capabilities WHERE submission_id = ?").get(created.id).n, 0);
  assert.equal(after.prepare("SELECT count(*) AS n FROM persons WHERE id = ?").get(created.personId).n, 0);
  after.close();

  console.log("contributor capability tests ok");
} finally {
  // The store keeps its SQLite connection open for the process. Windows will not delete the file until exit,
  // so cleanup is best effort and must never hide a test failure.
  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch {
    console.warn(`[contributor-capability] temp directory left in place: ${workDir}`);
  }
}
