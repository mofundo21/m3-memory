'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { useMemoryWizard } from '@/hooks/useMemoryWizard';

export default function WriteMemoryPage() {
  const router = useRouter();
  const { state, updateField, isLoaded } = useMemoryWizard();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded) {
    return <div className="memory-shell center-shell">Loading...</div>;
  }

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!state.memoryText.trim()) {
      setError('Please share your memory to continue.');
      return;
    }

    setIsSubmitting(true);
    router.push('/remember/details');
  };

  return (
    <div className="memory-shell">
      <div className="memory-header">
        <div className="wordmark">M3 Memory</div>
        <div>Step 2 of 4</div>
      </div>

      <div className="memory-card">
        <div className="intro">
          <h1>Your Memory</h1>
          <p>What do you remember? Take your time.</p>
        </div>

        <form onSubmit={handleContinue} className="memory-form">
          {error && (
            <div className="error-note">{error}</div>
          )}

          <fieldset className="field" style={{ border: 'none', padding: 0, margin: '0 0 24px' }}>
            <legend className="kicker" style={{ marginBottom: '8px' }}>About you</legend>
            <div className="grid">
              <div className="field">
                <label htmlFor="submitterName">
                  <span className="kicker">Optional</span>
                  Your name
                </label>
                <input
                  type="text"
                  id="submitterName"
                  name="submitterName"
                  value={state.submitterName}
                  onChange={(e) => updateField('submitterName', e.target.value)}
                  placeholder="Leave blank for Anonymous"
                  autoComplete="name"
                  className="field-input"
                />
              </div>

              <div className="field">
                <label htmlFor="contact">Your email</label>
                <input
                  type="email"
                  id="contact"
                  name="contact"
                  value={state.contact}
                  onChange={(e) => updateField('contact', e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="field-input"
                />
              </div>
            </div>
          </fieldset>

          <div className="field main-memory-field">
            <label htmlFor="memoryText">
              <span className="kicker">Required</span>
              The memory
            </label>
            <textarea
              id="memoryText"
              name="memoryText"
              value={state.memoryText}
              onChange={(e) => updateField('memoryText', e.target.value)}
              placeholder="Describe what you remember. What happened? What struck you? What did they say?"
              className="field-input"
            />
          </div>

          <details className="group" style={{ marginTop: '24px' }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: 500,
              color: 'var(--text)',
              padding: '8px 0',
              userSelect: 'none'
            }}>
              <span className="kicker" style={{ marginBottom: '4px' }}>Optional</span> Guided prompts
            </summary>

            <div className="prompt-group">
              <div className="field">
                <label htmlFor="whereWe">Where were we?</label>
                <textarea
                  id="whereWe"
                  name="whereWe"
                  value={state.whereWe}
                  onChange={(e) => updateField('whereWe', e.target.value)}
                  rows={2}
                  className="field-input"
                />
              </div>

              <div className="field">
                <label htmlFor="aroundWhen">Around when was this?</label>
                <textarea
                  id="aroundWhen"
                  name="aroundWhen"
                  value={state.aroundWhen}
                  onChange={(e) => updateField('aroundWhen', e.target.value)}
                  rows={2}
                  className="field-input"
                />
              </div>

              <div className="field">
                <label htmlFor="whoElse">Who else was there?</label>
                <textarea
                  id="whoElse"
                  name="whoElse"
                  value={state.whoElse}
                  onChange={(e) => updateField('whoElse', e.target.value)}
                  rows={2}
                  className="field-input"
                />
              </div>

              <div className="field">
                <label htmlFor="whatMadeStick">What made it stick with you?</label>
                <textarea
                  id="whatMadeStick"
                  name="whatMadeStick"
                  value={state.whatMadeStick}
                  onChange={(e) => updateField('whatMadeStick', e.target.value)}
                  rows={2}
                  className="field-input"
                />
              </div>

              <div className="field">
                <label htmlFor="dontRemember">Is there something you think I probably don't remember?</label>
                <textarea
                  id="dontRemember"
                  name="dontRemember"
                  value={state.dontRemember}
                  onChange={(e) => updateField('dontRemember', e.target.value)}
                  rows={2}
                  className="field-input"
                />
              </div>
            </div>
          </details>

          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action"
            >
              Keep Going →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
