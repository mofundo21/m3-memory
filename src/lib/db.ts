import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { submissionStatuses, type ReviewInput, type SubmissionInput, type SubmissionStatus } from "./types";
import {
  createSupabaseSubmission,
  getPersistenceMode,
  getSupabaseSubmission,
  listSupabaseSubmissions,
  upsertSupabaseReview,
  createSupabaseStoryDraft,
  getSupabaseStoryDrafts,
  updateSupabaseStoryDraft,
  uploadSupabaseMedia,
  insertSupabaseMediaRows,
  getSupabaseSubmissionMedia,
  updateSupabaseSubmissionPreferences,
  type NormalizedReview,
  type NormalizedSubmission
} from "./supabase";

let db: DatabaseSync | null = null;

function getDb() {
  if (db) return db;

  const databasePath = resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || ".m3-memory/m3-memory.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      contact TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      submitter_person_id TEXT,
      original_json TEXT NOT NULL,
      memory_preview TEXT NOT NULL,
      encounter_date TEXT,
      is_approximate_date INTEGER NOT NULL DEFAULT 0,
      location_name TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      event_name TEXT,
      media_link TEXT,
      media_consent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'UNREVIEWED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (submitter_person_id) REFERENCES persons(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL UNIQUE,
      notes TEXT,
      remembered TEXT,
      corrections TEXT,
      context TEXT,
      people TEXT,
      tags TEXT,
      importance INTEGER,
      emotional_significance INTEGER,
      historical_significance INTEGER,
      accuracy_confidence INTEGER,
      book_potential INTEGER,
      chapter_category TEXT,
      private_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      label TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS story_drafts (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'AI-GENERATED DRAFT',
      draft_text TEXT NOT NULL,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );
  `);

  // Ensure media columns exist (additive, safe to run multiple times)
  try {
    db.exec("ALTER TABLE submissions ADD COLUMN media_link TEXT");
  } catch {
    // Column already exists, safe to ignore
  }
  try {
    db.exec("ALTER TABLE submissions ADD COLUMN media_consent INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists, safe to ignore
  }
  // Ensure Act III preference columns exist (additive, safe to run multiple times)
  try {
    db.exec("ALTER TABLE submissions ADD COLUMN attribution_preference TEXT DEFAULT 'anonymous'");
  } catch {
    // Column already exists, safe to ignore
  }
  try {
    db.exec("ALTER TABLE submissions ADD COLUMN preferred_attribution TEXT");
  } catch {
    // Column already exists, safe to ignore
  }
  try {
    db.exec("ALTER TABLE submissions ADD COLUMN book_note TEXT");
  } catch {
    // Column already exists, safe to ignore
  }
  try {
    db.exec("ALTER TABLE submissions ADD COLUMN final_notes TEXT");
  } catch {
    // Column already exists, safe to ignore
  }

  return db;
}

function now() {
  return new Date().toISOString();
}

function text(value: string | undefined, max = 4000) {
  return (value || "").trim().slice(0, max);
}

function optionalText(value: string | undefined, max = 4000) {
  const cleaned = text(value, max);
  return cleaned || null;
}

function rating(value: number | undefined): number | null {
  const n = value ?? 0;
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function requireStatus(status: SubmissionStatus) {
  if (!submissionStatuses.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
}

function normalizeSubmission(input: SubmissionInput): NormalizedSubmission {
  const createdAt = now();
  const submitterName = text(input.submitterName, 160);
  const memoryText = text(input.memoryText, 12000);

  if (!submitterName || !memoryText) {
    throw new Error("INVALID_SUBMISSION");
  }

  const original: SubmissionInput = {
    submitterName,
    contact: text(input.contact, 240),
    encounterDate: text(input.encounterDate, 40),
    isApproximateDate: Boolean(input.isApproximateDate),
    locationName: text(input.locationName, 240),
    city: text(input.city, 120),
    region: text(input.region, 120),
    country: text(input.country, 120),
    eventName: text(input.eventName, 240),
    howMet: text(input.howMet, 4000),
    memoryText,
    beforeText: text(input.beforeText, 4000),
    afterText: text(input.afterText, 4000),
    metAgain: text(input.metAgain, 4000),
    peoplePresent: text(input.peoplePresent, 4000),
    yerielWearing: text(input.yerielWearing, 2000),
    submitterWearing: text(input.submitterWearing, 2000),
    talkedAbout: text(input.talkedAbout, 4000),
    exchanged: text(input.exchanged, 2000),
    artifactInfo: text(input.artifactInfo, 4000),
    forgottenPrompt: text(input.forgottenPrompt, 4000),
    bookPagePrompt: text(input.bookPagePrompt, 4000),
    additionalComments: text(input.additionalComments, 4000),
    mediaLink: text(input.mediaLink, 500),
    mediaConsent: Boolean(input.mediaConsent),
    attributionPreference: input.attributionPreference || "anonymous",
    preferredAttribution: optionalText(input.preferredAttribution, 240),
    bookNote: optionalText(input.bookNote, 4000),
    finalNotes: optionalText(input.finalNotes, 4000)
  };

  return {
    id: randomUUID(),
    personId: randomUUID(),
    original,
    memoryPreview: memoryText.slice(0, 220),
    encounterDate: optionalText(original.encounterDate, 40),
    isApproximateDate: original.isApproximateDate || false,
    locationName: optionalText(original.locationName, 240),
    city: optionalText(original.city, 120),
    region: optionalText(original.region, 120),
    country: optionalText(original.country, 120),
    eventName: optionalText(original.eventName, 240),
    createdAt
  };
}

function normalizeReview(input: ReviewInput): NormalizedReview {
  requireStatus(input.status);
  return {
    status: input.status,
    notes: optionalText(input.notes),
    remembered: optionalText(input.remembered),
    corrections: optionalText(input.corrections),
    context: optionalText(input.context),
    people: optionalText(input.people, 1000),
    tags: optionalText(input.tags, 1000),
    importance: rating(input.importance),
    emotional_significance: rating(input.emotionalSignificance),
    historical_significance: rating(input.historicalSignificance),
    accuracy_confidence: rating(input.accuracyConfidence),
    book_potential: rating(input.bookPotential),
    chapter_category: optionalText(input.chapterCategory, 240),
    private_notes: optionalText(input.privateNotes),
    updated_at: now()
  };
}

function requireSupabaseAdminToken(adminToken?: string | null) {
  if (!adminToken) throw new Error("UNAUTHENTICATED");
  return adminToken;
}

export async function createSubmission(input: SubmissionInput) {
  const record = normalizeSubmission(input);

  if (getPersistenceMode() === "supabase") {
    return createSupabaseSubmission(record);
  }

  const db = getDb();
  db.prepare("INSERT INTO persons (id, display_name, contact, created_at) VALUES (?, ?, ?, ?)").run(
    record.personId,
    record.original.submitterName,
    optionalText(record.original.contact, 240),
    record.createdAt
  );

  db.prepare(`
    INSERT INTO submissions (
      id, submitter_person_id, original_json, memory_preview, encounter_date,
      is_approximate_date, location_name, city, region, country, event_name,
      media_link, media_consent,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNREVIEWED', ?, ?)
  `).run(
    record.id,
    record.personId,
    JSON.stringify(record.original),
    record.memoryPreview,
    record.encounterDate,
    record.isApproximateDate ? 1 : 0,
    record.locationName,
    record.city,
    record.region,
    record.country,
    record.eventName,
    record.original.mediaLink || null,
    record.original.mediaConsent ? 1 : 0,
    record.createdAt,
    record.createdAt
  );

  return record.id;
}

function mapSupabaseListItem(item: any) {
  const person = Array.isArray(item.persons) ? item.persons[0] : item.persons;
  return {
    id: item.id,
    status: item.status,
    memoryPreview: item.memory_preview,
    encounterDate: item.encounter_date,
    locationName: item.location_name,
    city: item.city,
    region: item.region,
    country: item.country,
    eventName: item.event_name,
    createdAt: item.created_at,
    submitterName: person?.display_name || null
  };
}

export async function listSubmissions(adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const rows = await listSupabaseSubmissions(requireSupabaseAdminToken(adminToken));
    return rows.map(mapSupabaseListItem);
  }

  const db = getDb();
  return db.prepare(`
    SELECT
      submissions.id,
      submissions.status,
      submissions.memory_preview AS memoryPreview,
      submissions.encounter_date AS encounterDate,
      submissions.location_name AS locationName,
      submissions.city,
      submissions.region,
      submissions.country,
      submissions.event_name AS eventName,
      submissions.created_at AS createdAt,
      persons.display_name AS submitterName
    FROM submissions
    LEFT JOIN persons ON persons.id = submissions.submitter_person_id
    ORDER BY submissions.created_at DESC
  `).all();
}

function mapSupabaseDetail(row: any) {
  const person = Array.isArray(row.persons) ? row.persons[0] : row.persons;
  const reviews = Array.isArray(row.reviews) ? row.reviews : row.reviews ? [row.reviews] : [];
  const { persons, reviews: _reviews, original_json, ...submission } = row;
  void persons;
  void _reviews;
  return {
    ...submission,
    original_json: typeof original_json === "string" ? original_json : JSON.stringify(original_json),
    submitterName: person?.display_name || null,
    contact: person?.contact || null,
    original: typeof original_json === "string" ? JSON.parse(original_json) : original_json,
    review: reviews[0] || null
  };
}

export async function getSubmission(id: string, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const row = await getSupabaseSubmission(id, requireSupabaseAdminToken(adminToken));
    return row ? mapSupabaseDetail(row) : null;
  }

  const db = getDb();
  const submission = db.prepare(`
    SELECT
      submissions.*,
      persons.display_name AS submitterName,
      persons.contact AS contact
    FROM submissions
    LEFT JOIN persons ON persons.id = submissions.submitter_person_id
    WHERE submissions.id = ?
  `).get(id) as any;

  if (!submission) return null;

  const review = db.prepare("SELECT * FROM reviews WHERE submission_id = ?").get(id) || null;
  return {
    ...submission,
    original: JSON.parse(submission.original_json),
    review
  };
}

export async function upsertReview(submissionId: string, input: ReviewInput, adminToken?: string | null) {
  const review = normalizeReview(input);

  if (getPersistenceMode() === "supabase") {
    await upsertSupabaseReview(submissionId, review, requireSupabaseAdminToken(adminToken));
    return;
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM reviews WHERE submission_id = ?").get(submissionId) as any;
  const reviewId = existing?.id || randomUUID();

  if (existing) {
    db.prepare(`
      UPDATE reviews SET
        notes = ?, remembered = ?, corrections = ?, context = ?, people = ?, tags = ?,
        importance = ?, emotional_significance = ?, historical_significance = ?,
        accuracy_confidence = ?, book_potential = ?, chapter_category = ?, private_notes = ?,
        updated_at = ?
      WHERE submission_id = ?
    `).run(
      review.notes,
      review.remembered,
      review.corrections,
      review.context,
      review.people,
      review.tags,
      review.importance,
      review.emotional_significance,
      review.historical_significance,
      review.accuracy_confidence,
      review.book_potential,
      review.chapter_category,
      review.private_notes,
      review.updated_at,
      submissionId
    );
  } else {
    db.prepare(`
      INSERT INTO reviews (
        id, submission_id, notes, remembered, corrections, context, people, tags,
        importance, emotional_significance, historical_significance, accuracy_confidence,
        book_potential, chapter_category, private_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId,
      submissionId,
      review.notes,
      review.remembered,
      review.corrections,
      review.context,
      review.people,
      review.tags,
      review.importance,
      review.emotional_significance,
      review.historical_significance,
      review.accuracy_confidence,
      review.book_potential,
      review.chapter_category,
      review.private_notes,
      review.updated_at,
      review.updated_at
    );
  }

  db.prepare("UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?").run(
    review.status,
    review.updated_at,
    submissionId
  );
}

export async function createStoryDraft(submissionId: string, label: string, draftText: string, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const token = requireSupabaseAdminToken(adminToken);
    const draftId = randomUUID();
    const createdAt = now();
    return createSupabaseStoryDraft(submissionId, label, draftText, draftId, createdAt, token);
  }

  const db = getDb();
  const draftId = randomUUID();
  const createdAt = now();

  db.prepare(`
    INSERT INTO story_drafts (
      id, submission_id, label, draft_text, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    draftId,
    submissionId,
    label,
    draftText,
    createdAt
  );

  return draftId;
}

export async function getStoryDrafts(submissionId: string, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const token = requireSupabaseAdminToken(adminToken);
    return getSupabaseStoryDrafts(submissionId, token);
  }

  const db = getDb();
  return (db.prepare("SELECT * FROM story_drafts WHERE submission_id = ? ORDER BY created_at DESC").all(submissionId) as any[]) || [];
}

export async function updateStoryDraft(draftId: string, label: string, draftText: string, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const token = requireSupabaseAdminToken(adminToken);
    await updateSupabaseStoryDraft(draftId, label, draftText, token);
    return;
  }

  const db = getDb();

  db.prepare(`
    UPDATE story_drafts SET label = ?, draft_text = ? WHERE id = ?
  `).run(
    label,
    draftText,
    draftId
  );
}

// Media upload validation and persistence
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_FILES_PER_SUBMISSION = 5;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface MediaUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export function validateMediaUpload(files: MediaUploadInput[]) {
  if (files.length > MAX_FILES_PER_SUBMISSION) {
    throw new Error("TOO_MANY_FILES");
  }

  for (const file of files) {
    if (!file.mimeType || !ALLOWED_MIME_TYPES.has(file.mimeType)) {
      throw new Error("INVALID_MIME_TYPE");
    }
    if (file.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error("FILE_TOO_LARGE");
    }
  }
}

export async function insertMediaRows(submissionId: string, files: Array<{ fileName: string; mimeType: string; sizeBytes: number; storagePath: string }>, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const token = requireSupabaseAdminToken(adminToken);
    return insertSupabaseMediaRows(submissionId, files, token);
  }

  const db = getDb();
  const createdAt = now();

  for (const file of files) {
    db.prepare(`
      INSERT INTO media (id, submission_id, file_name, mime_type, storage_path, size_bytes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      submissionId,
      file.fileName,
      file.mimeType,
      file.storagePath,
      file.sizeBytes,
      createdAt
    );
  }
}

export async function getSubmissionMedia(submissionId: string, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const token = requireSupabaseAdminToken(adminToken);
    return getSupabaseSubmissionMedia(submissionId, token);
  }

  const db = getDb();
  return (db.prepare("SELECT id, file_name, mime_type, storage_path, size_bytes, created_at FROM media WHERE submission_id = ? ORDER BY created_at ASC").all(submissionId) as any[]) || [];
}

// Act III preference update (PATCH) — lightweight, does not touch original_json or media
export interface Act3UpdateInput {
  attributionPreference?: string;
  preferredAttribution?: string;
  bookNote?: string;
  finalNotes?: string;
}

export async function updateSubmissionPreferences(submissionId: string, input: Act3UpdateInput, adminToken?: string | null) {
  if (getPersistenceMode() === "supabase") {
    const token = requireSupabaseAdminToken(adminToken);
    await updateSupabaseSubmissionPreferences(submissionId, input, token);
    return;
  }

  const db = getDb();
  const updatedAt = now();

  db.prepare(`
    UPDATE submissions SET
      attribution_preference = ?,
      preferred_attribution = ?,
      book_note = ?,
      final_notes = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    input.attributionPreference || "anonymous",
    optionalText(input.preferredAttribution, 240),
    optionalText(input.bookNote, 4000),
    optionalText(input.finalNotes, 4000),
    updatedAt,
    submissionId
  );
}
