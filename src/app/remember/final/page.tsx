"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { redirect } from "next/navigation";

async function updatePreferences(submissionId: string, formData: any) {
  "use server";

  const { updateSubmissionPreferences } = await import("@/lib/db");

  try {
    await updateSubmissionPreferences(submissionId, {
      attributionPreference: formData.attributionPreference,
      preferredAttribution: formData.preferredAttribution,
      bookNote: formData.bookNote,
      finalNotes: formData.finalNotes
    });

    // Clear sessionStorage on success (via redirect)
    redirect("/thanks");
  } catch (error: any) {
    throw new Error(`Failed to save preferences: ${error.message}`);
  }
}

export default function FinalMemoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get("submissionId");

  const [formData, setFormData] = useState({
    bookNote: "",
    attributionPreference: "anonymous",
    preferredAttribution: "",
    finalNotes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!submissionId) {
      setError("Missing submission ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePreferences(submissionId, formData);
    } catch (err: any) {
      console.error("Error updating preferences:", err);
      setError(err.message || "Failed to save your preferences. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!submissionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error: Missing submission ID</p>
          <a href="/remember" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
            ← Back to start
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">One More Thing</h1>
          <p className="text-lg text-slate-600">Your memory is preserved exactly as you wrote it. These preferences are optional — they just let us know how you'd like to be recognized if your words ever become part of a larger story.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Book Note Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">If this becomes a story...</legend>
            <div>
              <label htmlFor="bookNote" className="block text-sm font-medium text-slate-700 mb-2">
                Add a note for that scenario (optional)
              </label>
              <textarea
                id="bookNote"
                value={formData.bookNote}
                onChange={(e) => setFormData({ ...formData, bookNote: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., This story reminds me of... or consider including..."
              />
            </div>
          </fieldset>

          {/* Attribution Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">How should I refer to you?</legend>
            <p className="text-sm text-slate-600 mb-4">This is your preference — not a publication guarantee. Your original memory is always yours, unchanged.</p>

            <div className="space-y-3">
              {[
                { value: "anonymous", label: "Anonymous" },
                { value: "first_name", label: "First name only" },
                { value: "full_name", label: "Full name" },
                { value: "nickname", label: "Nickname" },
                { value: "artist_name", label: "Artist or pen name" },
                { value: "initials", label: "Initials only" },
                { value: "custom", label: "Custom name or reference" }
              ].map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="attributionPreference"
                    value={option.value}
                    checked={formData.attributionPreference === option.value}
                    onChange={(e) => setFormData({ ...formData, attributionPreference: e.target.value })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>

            {formData.attributionPreference === "custom" && (
              <div className="mt-4">
                <input
                  type="text"
                  value={formData.preferredAttribution}
                  onChange={(e) => setFormData({ ...formData, preferredAttribution: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your custom name or reference"
                />
              </div>
            )}
          </fieldset>

          {/* Final Notes Section */}
          <fieldset className="space-y-6 border-b border-slate-200 pb-8">
            <legend className="text-xl font-semibold text-slate-900 mb-4">One more thing...</legend>
            <div>
              <label htmlFor="finalNotes" className="block text-sm font-medium text-slate-700 mb-2">
                Final notes or thoughts (optional)
              </label>
              <textarea
                id="finalNotes"
                value={formData.finalNotes}
                onChange={(e) => setFormData({ ...formData, finalNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Anything else you'd like us to know?"
              />
            </div>
          </fieldset>

          {/* Summary Section (Read-only) */}
          <div className="border border-slate-200 rounded-lg bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Memory Summary</h2>
            <p className="text-sm text-slate-600 mb-4">Review your submission before confirming:</p>
            <div className="text-sm text-slate-700 space-y-2 mb-4">
              <p>
                <span className="font-medium">Status:</span> Ready to submit — your original memory is preserved exactly as written.
              </p>
              <p>
                <span className="font-medium">Attribution:</span> {formData.attributionPreference === "custom" ? formData.preferredAttribution || "Custom name (not yet specified)" : `${formData.attributionPreference}`}
              </p>
            </div>
            <a
              href="/remember/write"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← Edit your memory
            </a>
          </div>

          {/* Error Display */}
          {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Submit Button */}
          <div className="pt-8 flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              {isSubmitting ? "Submitting..." : "Submit Memory"}
            </button>
            <a
              href="/remember"
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors duration-200"
            >
              Back
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
