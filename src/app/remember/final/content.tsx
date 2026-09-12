"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { updatePreferencesAction } from "../actions";
import { useMemoryWizard } from "@/hooks/useMemoryWizard";

export default function FinalMemoryContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const { state } = useMemoryWizard();

  const [formData, setFormData] = useState({
    submitterName: state.submitterName || "",
    contact: state.contact || "",
    bookNote: state.bookNote || "",
    attributionPreference: state.attributionPreference || "anonymous",
    preferredAttribution: "",
    finalNotes: state.finalNotes || ""
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
      await updatePreferencesAction(submissionId, formData);
    } catch (err: any) {
      console.error("Error updating preferences:", err);
      setError(err.message || "Failed to save your preferences. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!submissionId) {
    return (
      <div className="memory-shell center-shell">
        <div className="intro">
          <h1>Missing Submission</h1>
          <p>Something went wrong. Please start over.</p>
        </div>
        <a href="/remember" className="primary-action">
          ← Back to start
        </a>
      </div>
    );
  }

  return (
    <div className="memory-shell">
      <div className="memory-header">
        <div className="wordmark">M3 Memory</div>
        <div>Step 4 of 4</div>
      </div>

      <div className="memory-card">
        <div className="intro">
          <h1>Leave Your Mark</h1>
          <p>Your memory is preserved exactly as you wrote it. These details let us know how to credit you.</p>
        </div>

        <form onSubmit={handleSubmit} className="memory-form">
          {error && (
            <div className="error-note">{error}</div>
          )}

          <div className="grid">
            <div className="field">
              <label htmlFor="submitterName">
                <span className="kicker">Optional</span>
                Your name
              </label>
              <input
                type="text"
                id="submitterName"
                value={formData.submitterName}
                onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                placeholder="Leave blank for Anonymous"
                className="field-input"
              />
            </div>

            <div className="field">
              <label htmlFor="contact">Your email</label>
              <input
                type="email"
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="your@email.com"
                className="field-input"
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '24px' }}>
            <label htmlFor="bookNote">
              <span className="kicker">Optional</span>
              What would you want me to know?
            </label>
            <textarea
              id="bookNote"
              value={formData.bookNote}
              onChange={(e) => setFormData({ ...formData, bookNote: e.target.value })}
              rows={3}
              className="field-input"
              placeholder="This story reminds me of... or I think you should know that..."
            />
          </div>

          <fieldset style={{ marginTop: '24px' }}>
            <legend style={{
              color: 'var(--text)',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              How should I refer to you?
            </legend>
            <p className="micro-note" style={{ marginBottom: '16px' }}>
              Your original memory stays unchanged. This is just how I might credit you.
            </p>

            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { value: "anonymous", label: "Anonymous" },
                { value: "first_name", label: "First name only" },
                { value: "full_name", label: "Full name" },
                { value: "nickname", label: "Nickname" },
                { value: "artist_name", label: "Artist or pen name" },
                { value: "initials", label: "Initials only" },
                { value: "custom", label: "Custom name or reference" }
              ].map((option) => (
                <label key={option.value} className="checkline">
                  <input
                    type="radio"
                    name="attributionPreference"
                    value={option.value}
                    checked={formData.attributionPreference === option.value}
                    onChange={(e) => setFormData({ ...formData, attributionPreference: e.target.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {formData.attributionPreference === "custom" && (
              <div className="field" style={{ marginTop: '16px' }}>
                <input
                  type="text"
                  value={formData.preferredAttribution}
                  onChange={(e) => setFormData({ ...formData, preferredAttribution: e.target.value })}
                  className="field-input"
                  placeholder="Your custom name or reference"
                />
              </div>
            )}
          </fieldset>

          <div className="field" style={{ marginTop: '24px' }}>
            <label htmlFor="finalNotes">Anything else?</label>
            <textarea
              id="finalNotes"
              value={formData.finalNotes}
              onChange={(e) => setFormData({ ...formData, finalNotes: e.target.value })}
              rows={2}
              className="field-input"
              placeholder="Other thoughts or context..."
            />
          </div>

          <div className="panel" style={{ marginTop: '32px' }}>
            <h2>Your Memory</h2>
            <div className="original-field">
              <strong>Status</strong>
              <p>Memory written ✓</p>
            </div>
            <div className="original-field">
              <strong>Preferred name</strong>
              <p>
                {formData.attributionPreference === "custom"
                  ? formData.preferredAttribution || "(not yet specified)"
                  : formData.submitterName || "(will use Anonymous)"}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action"
            >
              {isSubmitting ? "Sending..." : "Send My Memory →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
