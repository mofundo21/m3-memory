import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { ReviewInput, SubmissionInput } from "./types";

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

export function createSubmission(input: SubmissionInput) {
  const db = getDb();
  const createdAt = now();
  const personId = randomUUID();
  const submissionId = randomUUID();
  const memoryPreview = input.memoryText.trim().slice(0, 220);

  db.prepare("INSERT INTO persons (id, display_name, contact, created_at) VALUES (?, ?, ?, ?)").run(
    personId,
    input.submitterName.trim(),
    input.contact?.trim() || null,
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
    JSON.stringify(input),
    memoryPreview,
    input.encounterDate || null,
    input.isApproximateDate ? 1 : 0,
    input.locationName || null,
    input.city || null,
    input.region || null,
    input.country || null,
    input.eventName || null,
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
      input.notes || null,
      input.remembered || null,
      input.corrections || null,
      input.context || null,
      input.people || null,
      input.tags || null,
      input.importance || null,
      input.emotionalSignificance || null,
      input.historicalSignificance || null,
      input.accuracyConfidence || null,
      input.bookPotential || null,
      input.chapterCategory || null,
      input.privateNotes || null,
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
      input.notes || null,
      input.remembered || null,
      input.corrections || null,
      input.context || null,
      input.people || null,
      input.tags || null,
      input.importance || null,
      input.emotionalSignificance || null,
      input.historicalSignificance || null,
      input.accuracyConfidence || null,
      input.bookPotential || null,
      input.chapterCategory || null,
      input.privateNotes || null,
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

