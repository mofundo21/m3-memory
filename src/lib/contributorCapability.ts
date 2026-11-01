import "server-only";
import { createHash, randomBytes } from "node:crypto";
import {
  consumeContributorCapability,
  saveContributorPreferences,
  storeContributorCapability
} from "./db";

/**
 * Contributor-scoped write capability. Design: docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md (v3, final review
 * PASS WITH REQUIRED CHANGES, changes applied).
 *
 * A contributor who just created submission S gets a random 256-bit token in an httpOnly cookie. The server stores
 * only SHA-256(token) with an expiry. Saving the four contributor-owned fields consumes the token atomically, then
 * saves guarded by status = UNREVIEWED. Nothing here grants general UPDATE access.
 */

export const CONTRIBUTOR_CAPABILITY_TTL_SECONDS = 2 * 60 * 60;

/** The one public error for every failure. Internal detail is never interpolated into it. */
export const CONTRIBUTOR_ERROR_MESSAGE = "Preferences could not be saved. Please start again from the beginning.";

const CANONICAL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;
const ATTRIBUTION_CHOICES = new Set(["anonymous", "first_name", "full_name", "nickname", "artist_name", "initials", "custom"]);

export interface ContributorPreferences {
  attributionPreference: string;
  preferredAttribution: string | null;
  bookNote: string | null;
  finalNotes: string | null;
}

/** Category-only server log. Never logs a token, a hash, a cookie value, a body, or a backend message. */
export function logContributorEvent(category: "issue-failed" | "compensation-failed" | "redeem-rejected" | "backend-error") {
  console.warn(`[contributor-capability] ${category}`);
}

export function isCanonicalSubmissionId(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_ID.test(value);
}

export function cookieNameFor(submissionId: string) {
  if (!isCanonicalSubmissionId(submissionId)) throw new Error("INVALID_SUBMISSION_ID");
  return `m3_contrib_${submissionId}`;
}

/**
 * Cookie attributes. Clearing uses the same name, path and security attributes, plus an epoch expiry, so the
 * browser removes the cookie it set (a deletion with a different path does not remove it).
 */
export function cookieOptions(maxAge = CONTRIBUTOR_CAPABILITY_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/remember",
    maxAge,
    ...(maxAge === 0 ? { expires: new Date(0) } : {})
  };
}

/** 256 bits from the OS CSPRNG, unpadded base64url: exactly 43 characters. */
export function generateToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function formatCookieValue(submissionId: string, token: string) {
  return `${submissionId}.${token}`;
}

/** Strict shape check before anything else. Returns null for every malformed value. */
export function parseCookieValue(value: string | undefined): { submissionId: string; token: string } | null {
  if (typeof value !== "string" || value.length !== 36 + 1 + 43) return null;
  const submissionId = value.slice(0, 36);
  const token = value.slice(37);
  if (value[36] !== ".") return null;
  if (!isCanonicalSubmissionId(submissionId) || !TOKEN_SHAPE.test(token)) return null;
  return { submissionId, token };
}

/** Issue a capability for a just-created submission. Returns the raw token (for the cookie only). */
export async function issueCapability(submissionId: string, now: Date) {
  const token = generateToken();
  const expiresAt = new Date(now.getTime() + CONTRIBUTOR_CAPABILITY_TTL_SECONDS * 1000).toISOString();
  await storeContributorCapability(submissionId, hashToken(token), expiresAt);
  return token;
}

/**
 * Redeem a capability for one save. The SID comes from the parsed cookie, must equal the submission id the caller
 * names, and is the only id used for database predicates. Consume happens before the save.
 */
export async function redeemCapability(submissionId: string, cookieValue: string | undefined, prefs: ContributorPreferences, now: Date) {
  const parsed = parseCookieValue(cookieValue);
  if (!parsed || parsed.submissionId !== submissionId) {
    logContributorEvent("redeem-rejected");
    return false;
  }
  const consumed = await consumeContributorCapability(parsed.submissionId, hashToken(parsed.token), now.toISOString());
  if (!consumed) {
    logContributorEvent("redeem-rejected");
    return false;
  }
  const saved = await saveContributorPreferences(parsed.submissionId, prefs);
  if (!saved) logContributorEvent("redeem-rejected");
  return saved;
}

/** Build the four-field allowlist from untrusted form data. Every other key is ignored. */
export function sanitizePreferences(form: Record<string, unknown>): ContributorPreferences {
  const text = (value: unknown, max: number) => {
    const s = typeof value === "string" ? value.trim() : "";
    return s ? s.slice(0, max) : null;
  };
  const choice = typeof form.attributionPreference === "string" ? form.attributionPreference : "";
  return {
    attributionPreference: ATTRIBUTION_CHOICES.has(choice) ? choice : "anonymous",
    preferredAttribution: text(form.preferredAttribution, 240),
    bookNote: text(form.bookNote, 4000),
    finalNotes: text(form.finalNotes, 4000)
  };
}
