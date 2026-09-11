import "server-only";
import { randomUUID } from "node:crypto";
import type { ReviewInput, SubmissionInput, SubmissionStatus } from "./types";

export type LoginResult = "ok" | "invalid" | "unauthorized" | "expired";

export type SupabaseAdminSession = {
  accessToken: string;
  userId: string;
  email: string;
};

type FetchLike = typeof fetch;

type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export type NormalizedSubmission = {
  id: string;
  personId: string;
  original: SubmissionInput;
  memoryPreview: string;
  encounterDate: string | null;
  isApproximateDate: boolean;
  locationName: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  eventName: string | null;
  createdAt: string;
};

export type NormalizedReview = {
  status: SubmissionStatus;
  notes: string | null;
  remembered: string | null;
  corrections: string | null;
  context: string | null;
  people: string | null;
  tags: string | null;
  importance: number | null;
  emotional_significance: number | null;
  historical_significance: number | null;
  accuracy_confidence: number | null;
  book_potential: number | null;
  chapter_category: string | null;
  private_notes: string | null;
  updated_at: string;
};

export type NormalizedStoryDraft = {
  id: string;
  submissionId: string;
  label: string;
  draftText: string;
  createdAt: string;
};

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getPersistenceMode() {
  const explicit = process.env.M3_PERSISTENCE;
  if (explicit === "sqlite" || explicit === "supabase") return explicit;
  return hasSupabaseEnv() ? "supabase" : "sqlite";
}

export function getAdminAuthMode() {
  const explicit = process.env.M3_ADMIN_AUTH;
  if (explicit === "local" || explicit === "supabase") return explicit;
  return hasSupabaseEnv() ? "supabase" : "local";
}

export function requireCompatibleAuthMode() {
  if (getPersistenceMode() === "supabase" && getAdminAuthMode() !== "supabase") {
    throw new Error("SUPABASE_MISCONFIGURED");
  }
}

export function getSupabaseConfig(requireServiceRole = true): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !anonKey || (requireServiceRole && !serviceRoleKey)) {
    throw new Error("SUPABASE_MISCONFIGURED");
  }

  return { url, anonKey, serviceRoleKey };
}

function headers(apiKey: string, bearer = apiKey) {
  return {
    apikey: apiKey,
    authorization: `Bearer ${bearer}`,
    "content-type": "application/json"
  };
}

async function readJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function request(path: string, init: RequestInit, fetchImpl: FetchLike = fetch) {
  const res = await fetchImpl(path, init);
  if (!res.ok) {
    const error = new Error(res.status === 401 ? "UNAUTHENTICATED" : `SUPABASE_REQUEST_FAILED:${res.status}`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }
  return readJson(res);
}

export async function supabasePasswordLogin(email: string, password: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  const data = await request(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(config.anonKey),
    body: JSON.stringify({ email, password })
  }, fetchImpl).catch((error) => {
    if ((error as Error & { status?: number }).status === 400 || (error as Error & { status?: number }).status === 401) return null;
    throw error;
  }) as any;

  if (!data?.access_token || !data?.user?.id) return null;
  return {
    accessToken: String(data.access_token),
    userId: String(data.user.id),
    email: String(data.user.email || email)
  };
}

export async function getSupabaseUser(accessToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  const data = await request(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: headers(config.anonKey, accessToken)
  }, fetchImpl).catch(() => null) as any;

  if (!data?.id) return null;
  return { userId: String(data.id), email: String(data.email || "") };
}

export async function isSupabaseAdmin(accessToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  const rows = await request(`${config.url}/rest/v1/m3_admins?select=id&limit=1`, {
    method: "GET",
    headers: headers(config.anonKey, accessToken)
  }, fetchImpl).catch(() => []) as any[];
  return Array.isArray(rows) && rows.length > 0;
}

export async function verifySupabaseAdminToken(accessToken: string, fetchImpl: FetchLike = fetch) {
  const user = await getSupabaseUser(accessToken, fetchImpl);
  if (!user) return null;
  if (!(await isSupabaseAdmin(accessToken, fetchImpl))) return null;
  return { accessToken, ...user } satisfies SupabaseAdminSession;
}

export async function createSupabaseSubmission(record: NormalizedSubmission, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(true);
  await request(`${config.url}/rest/v1/persons`, {
    method: "POST",
    headers: { ...headers(config.serviceRoleKey), prefer: "return=minimal" },
    body: JSON.stringify({
      id: record.personId,
      display_name: record.original.submitterName,
      contact: record.original.contact || null,
      created_at: record.createdAt
    })
  }, fetchImpl);

  await request(`${config.url}/rest/v1/submissions`, {
    method: "POST",
    headers: { ...headers(config.serviceRoleKey), prefer: "return=minimal" },
    body: JSON.stringify({
      id: record.id,
      submitter_person_id: record.personId,
      original_json: record.original,
      memory_preview: record.memoryPreview,
      encounter_date: record.encounterDate,
      is_approximate_date: record.isApproximateDate,
      location_name: record.locationName,
      city: record.city,
      region: record.region,
      country: record.country,
      event_name: record.eventName,
      media_link: record.original.mediaLink || null,
      media_consent: record.original.mediaConsent || false,
      status: "UNREVIEWED",
      created_at: record.createdAt,
      updated_at: record.createdAt
    })
  }, fetchImpl);

  return record.id;
}

export async function listSupabaseSubmissions(adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  return request(`${config.url}/rest/v1/submissions?select=id,status,memory_preview,encounter_date,location_name,city,region,country,event_name,created_at,persons(display_name)&order=created_at.desc`, {
    method: "GET",
    headers: headers(config.anonKey, adminToken)
  }, fetchImpl) as Promise<any[]>;
}

export async function getSupabaseSubmission(id: string, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  const rows = await request(`${config.url}/rest/v1/submissions?select=*,persons(display_name,contact),reviews(*)&id=eq.${encodeURIComponent(id)}&limit=1`, {
    method: "GET",
    headers: headers(config.anonKey, adminToken)
  }, fetchImpl) as any[];
  return rows[0] || null;
}

export async function upsertSupabaseReview(submissionId: string, review: NormalizedReview, adminToken?: string | null, fetchImpl: FetchLike = fetch) {
  if (!adminToken) throw new Error("UNAUTHENTICATED");
  const config = getSupabaseConfig(false);
  const existing = await request(`${config.url}/rest/v1/reviews?select=id&submission_id=eq.${encodeURIComponent(submissionId)}&limit=1`, {
    method: "GET",
    headers: headers(config.anonKey, adminToken)
  }, fetchImpl) as any[];

  const reviewPayload = {
    notes: review.notes,
    remembered: review.remembered,
    corrections: review.corrections,
    context: review.context,
    people: review.people,
    tags: review.tags,
    importance: review.importance,
    emotional_significance: review.emotional_significance,
    historical_significance: review.historical_significance,
    accuracy_confidence: review.accuracy_confidence,
    book_potential: review.book_potential,
    chapter_category: review.chapter_category,
    private_notes: review.private_notes,
    updated_at: review.updated_at
  };

  if (existing[0]?.id) {
    await request(`${config.url}/rest/v1/reviews?submission_id=eq.${encodeURIComponent(submissionId)}`, {
      method: "PATCH",
      headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
      body: JSON.stringify(reviewPayload)
    }, fetchImpl);
  } else {
    await request(`${config.url}/rest/v1/reviews`, {
      method: "POST",
      headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
      body: JSON.stringify({ submission_id: submissionId, ...reviewPayload })
    }, fetchImpl);
  }

  await request(`${config.url}/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, {
    method: "PATCH",
    headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
    body: JSON.stringify({ status: review.status, updated_at: review.updated_at })
  }, fetchImpl);
}

export async function createSupabaseStoryDraft(submissionId: string, label: string, draftText: string, draftId: string, createdAt: string, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  await request(`${config.url}/rest/v1/story_drafts`, {
    method: "POST",
    headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
    body: JSON.stringify({
      id: draftId,
      submission_id: submissionId,
      label,
      draft_text: draftText,
      created_at: createdAt
    })
  }, fetchImpl);
  return draftId;
}

export async function getSupabaseStoryDrafts(submissionId: string, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  return request(`${config.url}/rest/v1/story_drafts?submission_id=eq.${encodeURIComponent(submissionId)}&order=created_at.desc`, {
    method: "GET",
    headers: headers(config.anonKey, adminToken)
  }, fetchImpl) as Promise<any[]>;
}

export async function updateSupabaseStoryDraft(draftId: string, label: string, draftText: string, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  await request(`${config.url}/rest/v1/story_drafts?id=eq.${encodeURIComponent(draftId)}`, {
    method: "PATCH",
    headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
    body: JSON.stringify({ label, draft_text: draftText })
  }, fetchImpl);
}

export async function uploadSupabaseMedia(submissionId: string, fileName: string, fileBuffer: Uint8Array | Buffer, contentType: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(true);
  const storagePath = `submissions/${submissionId}/${randomUUID()}-${sanitizeFileName(fileName)}`;

  const body = Buffer.isBuffer(fileBuffer) ? new Uint8Array(fileBuffer) : fileBuffer;

  await request(`${config.url}/storage/v1/object/submission-media/${encodeURIComponent(storagePath)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.serviceRoleKey}` },
    body: body as BodyInit
  }, fetchImpl);

  return storagePath;
}

export async function insertSupabaseMediaRows(submissionId: string, files: Array<{ fileName: string; mimeType: string; sizeBytes: number; storagePath: string }>, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  const createdAt = new Date().toISOString();

  const mediaRows = files.map(f => ({
    id: randomUUID(),
    submission_id: submissionId,
    file_name: f.fileName,
    mime_type: f.mimeType,
    storage_path: f.storagePath,
    size_bytes: f.sizeBytes,
    created_at: createdAt
  }));

  await request(`${config.url}/rest/v1/media`, {
    method: "POST",
    headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
    body: JSON.stringify(mediaRows)
  }, fetchImpl);
}

export async function getSupabaseSubmissionMedia(submissionId: string, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  return request(`${config.url}/rest/v1/media?submission_id=eq.${encodeURIComponent(submissionId)}&order=created_at.asc`, {
    method: "GET",
    headers: headers(config.anonKey, adminToken)
  }, fetchImpl) as Promise<any[]>;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export async function updateSupabaseSubmissionPreferences(submissionId: string, preferences: { attributionPreference?: string; preferredAttribution?: string; bookNote?: string; finalNotes?: string }, adminToken: string, fetchImpl: FetchLike = fetch) {
  const config = getSupabaseConfig(false);
  const updatedAt = new Date().toISOString();

  const payload = {
    attribution_preference: preferences.attributionPreference || "anonymous",
    preferred_attribution: preferences.preferredAttribution || null,
    book_note: preferences.bookNote || null,
    final_notes: preferences.finalNotes || null,
    updated_at: updatedAt
  };

  await request(`${config.url}/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, {
    method: "PATCH",
    headers: { ...headers(config.anonKey, adminToken), prefer: "return=minimal" },
    body: JSON.stringify(payload)
  }, fetchImpl);
}
