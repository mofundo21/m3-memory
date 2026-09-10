import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { submissionStatuses, type ReviewInput, type SubmissionInput, type SubmissionStatus } from "./types";

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

export function createSubmission(input: SubmissionInput) {
  const db = getDb();
  const createdAt = now();
  const personId = randomUUID();
  const submissionId = randomUUID();
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
    additionalComments: text(input.additionalComments, 4000)
  };
  const memoryPreview = memoryText.slice(0, 220);

  db.prepare("INSERT INTO persons (id, display_name, contact, created_at) VALUES (?, ?, ?, ?)").run(
    personId,
    submitterName,
    optionalText(original.contact, 240),
    createdAt
  );

  db.prepare(`
    INSERT INTO submissions (
      id, submitter_person_id, original_json, memory_preview, encounter_date,
      is_approximate_date, location_name, city, region, country, event_name,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNREVIEWED', ?, ?)
  `).run(
    submissionId,
    personId,
    JSON.stringify(original),
    memoryPreview,
    optionalText(original.encounterDate, 40),
    original.isApproximateDate ? 1 : 0,
    optionalText(original.locationName, 240),
    optionalText(original.city, 120),
    optionalText(original.region, 120),
    optionalText(original.country, 120),
    optionalText(original.eventName, 240),
    createdAt,
    createdAt
  );

  return submissionId;
}

export function listSubmissions() {
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

export function getSubmission(id: string) {
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

export function upsertReview(submissionId: string, input: ReviewInput) {
  requireStatus(input.status);
  const db = getDb();
  const existing = db.prepare("SELECT id FROM reviews WHERE submission_id = ?").get(submissionId) as any;
  const updatedAt = now();
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
      optionalText(input.notes),
      optionalText(input.remembered),
      optionalText(input.corrections),
      optionalText(input.context),
      optionalText(input.people, 1000),
      optionalText(input.tags, 1000),
      rating(input.importance),
      rating(input.emotionalSignificance),
      rating(input.historicalSignificance),
      rating(input.accuracyConfidence),
      rating(input.bookPotential),
      optionalText(input.chapterCategory, 240),
      optionalText(input.privateNotes),
      updatedAt,
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
      optionalText(input.notes),
      optionalText(input.remembered),
      optionalText(input.corrections),
      optionalText(input.context),
      optionalText(input.people, 1000),
      optionalText(input.tags, 1000),
      rating(input.importance),
      rating(input.emotionalSignificance),
      rating(input.historicalSignificance),
      rating(input.accuracyConfidence),
      rating(input.bookPotential),
      optionalText(input.chapterCategory, 240),
      optionalText(input.privateNotes),
      updatedAt,
      updatedAt
    );
  }

  db.prepare("UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?").run(
    input.status,
    updatedAt,
    submissionId
  );
}

