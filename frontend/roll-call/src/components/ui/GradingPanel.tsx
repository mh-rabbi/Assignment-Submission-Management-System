'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { GlassPanel } from './GlassPanel';

interface GradingPanelProps {
  maxMarks: number;
  initialMarks?: number | null;
  initialFeedback?: string | null;
  onSaveGrade: (marks: number, feedback: string) => Promise<void>;
}

export function GradingPanel({
  maxMarks,
  initialMarks = null,
  initialFeedback = '',
  onSaveGrade,
}: GradingPanelProps) {
  const [marks, setMarks] = useState<string>(
    initialMarks !== null ? String(initialMarks) : ''
  );
  const [feedback, setFeedback] = useState<string>(initialFeedback || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numMarks = Number(marks);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > maxMarks) {
      setError(`Marks must be a number between 0 and ${maxMarks}.`);
      return;
    }

    setLoading(true);
    try {
      await onSaveGrade(numMarks, feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel variant="muted" style={{ padding: '20px' }}>
      <h4
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '16px',
          color: 'var(--ink)',
        }}
      >
        Grade Submission
      </h4>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ fontSize: '13px', color: 'var(--stamp)' }}>{error}</div>
        )}

        <div className="field-group">
          <label className="field-label" htmlFor="marks">
            Marks (0 to {maxMarks})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="marks"
              type="number"
              min={0}
              max={maxMarks}
              required
              className="field-input"
              style={{ width: '120px' }}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              / {maxMarks}
            </span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="feedback">
            Feedback (Optional)
          </label>
          <textarea
            id="feedback"
            className="field-input field-textarea"
            rows={3}
            placeholder="Great work on chapter 2, but check your calculations in section B..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Saving grade...' : 'Save grade'}
        </Button>
      </form>
    </GlassPanel>
  );
}
