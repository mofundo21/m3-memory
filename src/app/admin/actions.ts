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
