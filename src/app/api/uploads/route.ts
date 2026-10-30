import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createHash, timingSafeEqual } from "node:crypto";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg","image/png","image/webp","image/heic","video/mp4","video/quicktime","audio/mpeg","audio/mp4","audio/wav","application/pdf"]);

export async function POST(request: Request) {
  try {
    const referenceCode = request.headers.get("x-archive-reference") || request.headers.get("x-m3-reference") || "";
    const email = (request.headers.get("x-archive-email") || request.headers.get("x-m3-email") || "").trim().toLowerCase();
    const uploadToken = request.headers.get("x-upload-token") || "";
    const fileName = decodeURIComponent(request.headers.get("x-archive-filename") || request.headers.get("x-m3-filename") || "evidence");
    const mimeType = request.headers.get("content-type") || "";
    const metadata = {
      media_category: decodeURIComponent(request.headers.get("x-media-category") || "Other"),
      caption: decodeURIComponent(request.headers.get("x-media-caption") || "") || null,
      description: decodeURIComponent(request.headers.get("x-media-description") || "") || null,
      people_pictured: decodeURIComponent(request.headers.get("x-media-people") || "") || null,
      approximate_date_text: decodeURIComponent(request.headers.get("x-media-date") || "") || null,
    };
    if (!referenceCode || (!uploadToken && !email)) return NextResponse.json({ error: "Missing upload information." }, { status: 400 });
    if (!ALLOWED_TYPES.has(mimeType)) return NextResponse.json({ error: `${fileName} is not a supported file type.` }, { status: 415 });
    const db = createSupabaseAdmin();
    const { data: submission } = await db.from("submissions").select("id,upload_token_hash,upload_token_expires_at,persons!inner(email,contact)").eq("reference_code", referenceCode).maybeSingle();
    const person = Array.isArray(submission?.persons) ? submission.persons[0] : submission?.persons;
    const storedEmail = String(person?.email || person?.contact || "").trim().toLowerCase();
    const suppliedHash = createHash("sha256").update(uploadToken).digest("hex");
    const tokenValid = Boolean(uploadToken && submission?.upload_token_hash && submission.upload_token_expires_at && new Date(submission.upload_token_expires_at) > new Date() && timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(submission.upload_token_hash)));
    const legacyEmailValid = Boolean(!submission?.upload_token_hash && storedEmail && storedEmail === email);
    if (!submission || (!tokenValid && !legacyEmailValid)) return NextResponse.json({ error: "Upload session could not be verified." }, { status: 403 });
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength < 1 || bytes.byteLength > MAX_FILE_SIZE) return NextResponse.json({ error: `${fileName} must be smaller than 25 MB.` }, { status: 413 });
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "evidence";
    const storagePath = `${submission.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await db.storage.from("memory-evidence").upload(storagePath, bytes, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const { error: recordError } = await db.from("media").insert({ submission_id: submission.id, file_name: fileName, mime_type: mimeType, storage_path: storagePath, size_bytes: bytes.byteLength, ...metadata });
    if (recordError) { await db.storage.from("memory-evidence").remove([storagePath]); throw recordError; }
    return NextResponse.json({ uploaded: true, fileName }, { status: 201 });
  } catch (error) {
    console.error("Evidence upload failed", error);
    return NextResponse.json({ error: "The evidence file could not be uploaded." }, { status: 500 });
  }
}
