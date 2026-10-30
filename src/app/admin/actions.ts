"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";

const statuses = new Set(["UNREVIEWED", "IN_REVIEW", "NEEDS_FOLLOW_UP", "APPROVED", "ARCHIVED", "REJECTED"]);

export async function updateSubmission(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("submissionId") || "");
  const status = String(formData.get("status") || "");
  if (!id || !statuses.has(status)) throw new Error("Invalid review update.");
  const db = createSupabaseAdmin();
  const { error: statusError } = await db.from("submissions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (statusError) throw statusError;
  const { error: flagError } = await db.from("submission_flags").upsert({
    submission_id: id,
    book_potential: formData.get("bookPotential") === "on",
    sensitive: formData.get("sensitive") === "on",
    needs_verification: formData.get("needsVerification") === "on",
    needs_follow_up: formData.get("needsFollowUp") === "on",
    updated_at: new Date().toISOString(),
  });
  if (flagError) throw flagError;
  if (formData.get("bookPotential") === "on") {
    const { error } = await db.from("book_desk_entries").upsert({ submission_id: id, category: String(formData.get("bookCategory") || "Unsorted"), notes: String(formData.get("bookNotes") || "").trim() || null, updated_at: new Date().toISOString() });
    if (error) throw error;
  } else {
    const { error } = await db.from("book_desk_entries").delete().eq("submission_id", id); if (error) throw error;
  }
  if (formData.get("needsFollowUp") === "on") {
    const { error } = await db.from("follow_ups").upsert({ submission_id: id, status: String(formData.get("followUpStatus") || "Needed"), reason: String(formData.get("followUpReason") || "").trim() || null, notes: String(formData.get("followUpNotes") || "").trim() || null, updated_at: new Date().toISOString() });
    if (error) throw error;
  } else {
    const { error } = await db.from("follow_ups").delete().eq("submission_id", id); if (error) throw error;
  }
  const selectedTagIds = formData.getAll("tagIds").map(String).filter(Boolean);
  const customTag = String(formData.get("customTag") || "").trim();
  if (customTag) {
    const { data: tag, error } = await db.from("tags").upsert({ name: customTag }, { onConflict: "name" }).select("id").single();
    if (error) throw error; selectedTagIds.push(tag.id);
  }
  const { error: clearTagsError } = await db.from("submission_tags").delete().eq("submission_id", id); if (clearTagsError) throw clearTagsError;
  if (selectedTagIds.length) { const { error } = await db.from("submission_tags").insert([...new Set(selectedTagIds)].map((tag_id) => ({ submission_id: id, tag_id }))); if (error) throw error; }
  const encounterId = String(formData.get("encounterId") || "");
  if (encounterId) {
    const verifiedDate = String(formData.get("verifiedDate") || "");
    const { error } = await db.from("encounters").update({ verified_occurred_on: verifiedDate || null, verified_event_name: String(formData.get("verifiedEvent") || "").trim() || null, verified_venue: String(formData.get("verifiedVenue") || "").trim() || null, verified_city: String(formData.get("verifiedCity") || "").trim() || null, verification_notes: String(formData.get("verificationNotes") || "").trim() || null, verification_source: String(formData.get("verificationSource") || "").trim() || null, verification_confidence: Number(formData.get("verificationConfidence") || 0) || null }).eq("id", encounterId);
    if (error) throw error;
  }
  const notes = String(formData.get("privateNotes") || "").trim();
  const { data: existing } = await db.from("reviews").select("id").eq("submission_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) {
    const { error } = await db.from("reviews").update({ private_notes: notes || null, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) throw error;
  } else if (notes) {
    const { error } = await db.from("reviews").insert({ submission_id: id, private_notes: notes });
    if (error) throw error;
  }
  revalidatePath("/admin"); revalidatePath(`/admin/submissions/${id}`);
}

export async function signOut() {
  const store = await cookies();
  store.getAll().filter((cookie) => cookie.name.includes("auth-token")).forEach((cookie) => store.delete(cookie.name));
  redirect("/admin/login");
}
