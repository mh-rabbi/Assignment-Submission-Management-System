'use client';

import type { SubmissionHistoryDto } from '@/lib/types';
import { GlassPanel } from './GlassPanel';
import { IconHistory, IconFile } from '@tabler/icons-react';

interface SubmissionHistoryProps {
  history: SubmissionHistoryDto[];
}

export function SubmissionHistory({ history }: SubmissionHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
        No previous edits recorded for this submission.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <IconHistory size={16} />
        <span>PREVIOUS VERSIONS ({history.length})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((item) => (
          <GlassPanel
            key={item.id}
            variant="muted"
            style={{
              padding: '14px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--moss)',
                marginBottom: '6px',
              }}
            >
              Edited at: {new Date(item.editedAt).toLocaleString()}
            </div>
            <div
              style={{
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              }}
            >
              {item.content}
            </div>
            {item.filePath && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                }}
              >
                <IconFile size={14} />
                <span>Attached file in this version</span>
              </div>
            )}
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
