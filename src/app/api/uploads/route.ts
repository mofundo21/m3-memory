import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg","image/png","image/webp","image/heic","video/mp4","video/quicktime","audio/mpeg","audio/mp4","audio/wav","application/pdf"]);

export async function POST(request: Request) {
  try {
    const referenceCode = request.headers.get("x-m3-reference") || "";
    const email = (request.headers.get("x-m3-email") || "").trim().toLowerCase();
    const fileName = decodeURIComponent(request.headers.get("x-m3-filename") || "evidence");
    const mimeType = request.headers.get("content-type") || "";
    if (!referenceCode || !email) return NextResponse.json({ error: "Missing upload information." }, { status: 400 });
    if (!ALLOWED_TYPES.has(mimeType)) return NextResponse.json({ error: `${fileName} is not a supported file type.` }, { status: 415 });
    const db = createSupabaseAdmin();
    const { data: submission } = await db.from("submissions").select("id,persons!inner(email,contact)").eq("reference_code", referenceCode).maybeSingle();
    const person = Array.isArray(submission?.persons) ? submission.persons[0] : submission?.persons;
    const storedEmail = String(person?.email || person?.contact || "").trim().toLowerCase();
    if (!submission || storedEmail !== email) return NextResponse.json({ error: "Upload session could not be verified." }, { status: 403 });
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength < 1 || bytes.byteLength > MAX_FILE_SIZE) return NextResponse.json({ error: `${fileName} must be smaller than 25 MB.` }, { status: 413 });
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "evidence";
    const storagePath = `${submission.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await db.storage.from("memory-evidence").upload(storagePath, bytes, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const { error: recordError } = await db.from("media").insert({ submission_id: submission.id, file_name: fileName, mime_type: mimeType, storage_path: storagePath, size_bytes: bytes.byteLength });
    if (recordError) { await db.storage.from("memory-evidence").remove([storagePath]); throw recordError; }
    return NextResponse.json({ uploaded: true, fileName }, { status: 201 });
  } catch (error) {
    console.error("Evidence upload failed", error);
    return NextResponse.json({ error: "The evidence file could not be uploaded." }, { status: 500 });
  }
}
