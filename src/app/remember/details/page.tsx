'use client';

import { useState, useRef } from 'react';
import { submitMemoryAction } from '@/app/remember/actions';
import { useMemoryWizard } from '@/hooks/useMemoryWizard';

export default function AddToMemoryPage() {
  const { state, updateField, updateMultiple, addMediaFile, removeMediaFile, isLoaded } = useMemoryWizard();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoaded) {
    return <div className="memory-shell center-shell">Loading...</div>;
  }

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      Array.from(files).forEach(file => {
        addMediaFile(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('memoryText', state.memoryText);
      formData.append('whereWe', state.whereWe);
      formData.append('aroundWhen', state.aroundWhen);
      formData.append('whoElse', state.whoElse);
      formData.append('whatMadeStick', state.whatMadeStick);
      formData.append('dontRemember', state.dontRemember);
      formData.append('encounterDate', state.encounterDate);
      formData.append('isApproximateDate', state.isApproximateDate ? 'on' : '');
      formData.append('locationName', state.locationName);
      formData.append('eventName', state.eventName);
      formData.append('mediaLink', state.mediaLink);
      formData.append('mediaConsent', state.mediaConsent ? 'on' : '');

      state.mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      await submitMemoryAction(formData);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="memory-shell">
      <div className="memory-header">
        <div className="wordmark">M3 Memory</div>
        <div>Step 3 of 4</div>
      </div>

      <div className="memory-card">
        <div className="intro">
          <h1>Add to the Memory</h1>
          <p>Got something that belongs with it? A blurry photo is okay. An old screenshot is okay.</p>
        </div>

        <form onSubmit={handleSubmit} className="memory-form">
          {error && (
            <div className="error-note">{error}</div>
          )}

          <div className="grid">
            <div className="field">
              <label htmlFor="encounterDate">
                <span className="kicker">Optional</span>
                When?
              </label>
              <div className="soft-grid">
                <input
                  type="date"
                  id="encounterDate"
                  name="encounterDate"
                  value={state.encounterDate}
                  onChange={(e) => updateField('encounterDate', e.target.value)}
                  className="field-input"
                />
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={state.isApproximateDate}
                    onChange={(e) => updateField('isApproximateDate', e.target.checked)}
                  />
                  <span>Approximate</span>
                </label>
              </div>
            </div>

            <div className="field">
              <label htmlFor="locationName">Where?</label>
              <input
                type="text"
                id="locationName"
                name="locationName"
                value={state.locationName}
                onChange={(e) => updateField('locationName', e.target.value)}
                placeholder="e.g. Coffee shop, Festival, Friend's place"
                className="field-input"
              />
            </div>

            <div className="field">
              <label htmlFor="eventName">What event or occasion?</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={state.eventName}
                onChange={(e) => updateField('eventName', e.target.value)}
                placeholder="e.g. Lantern Night, Summer party"
                className="field-input"
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '24px' }}>
            <label>
              <span className="kicker">Optional</span>
              Media
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleAddMedia}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn"
            >
              + Add photos or videos
            </button>

            {state.mediaFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p className="micro-note">
                  {state.mediaFiles.length} file{state.mediaFiles.length !== 1 ? 's' : ''} attached
                </p>
                <div className="stack" style={{ marginTop: '12px' }}>
                  {state.mediaFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ color: 'var(--muted)' }}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="field" style={{ marginTop: '24px' }}>
            <label htmlFor="mediaLink">Link to a photo or video?</label>
            <input
              type="url"
              id="mediaLink"
              name="mediaLink"
              value={state.mediaLink}
              onChange={(e) => updateField('mediaLink', e.target.value)}
              placeholder="https://..."
              className="field-input"
            />
          </div>

          {state.mediaFiles.length > 0 || state.mediaLink && (
            <label className="checkline">
              <input
                type="checkbox"
                checked={state.mediaConsent}
                onChange={(e) => updateField('mediaConsent', e.target.checked)}
              />
              <span>You agree that I can use this in the book</span>
            </label>
          )}

          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action"
            >
              One Last Thing →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
