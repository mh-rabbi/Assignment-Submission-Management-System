'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  submissionsApi,
  assignmentsApi,
  ApiException,
} from '@/lib/api';
import type {
  SubmissionDto,
  AssignmentDto,
  SubmissionHistoryDto,
} from '@/lib/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GradingPanel } from '@/components/ui/GradingPanel';
import { SubmissionHistory } from '@/components/ui/SubmissionHistory';
import { useToast } from '@/components/ui/Toast';
import { IconArrowLeft, IconDownload } from '@tabler/icons-react';

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const { showToast } = useToast();

  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [history, setHistory] = useState<SubmissionHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sub = await submissionsApi.get(id);
      setSubmission(sub);

      const [ass, hList] = await Promise.all([
        assignmentsApi.get(sub.assignmentId).catch(() => null),
        submissionsApi.getHistory(id).catch(() => []),
      ]);

      setAssignment(ass);
      setHistory(hList);
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 404) {
        showToast('Submission not found.', 'error');
      } else if (err instanceof ApiException && err.statusCode === 403) {
        showToast('You do not have permission to view this submission.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveGrade = async (marks: number, feedback: string) => {
    try {
      const updated = await submissionsApi.grade(id, { marks, feedback });
      setSubmission(updated);
      showToast('Grade saved successfully.');
    } catch (err) {
      if (err instanceof ApiException) {
        throw new Error(err.apiError.message);
      }
      throw new Error('Failed to save grade.');
    }
  };

  if (loading) {
    return <div>Loading submission...</div>;
  }

  if (!submission) {
    return (
      <div>
        <Link href="/submissions" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <IconArrowLeft size={16} /> Back to submissions
        </Link>
        <GlassPanel variant="muted" style={{ padding: '32px', textAlign: 'center' }}>
          Submission not found or inaccessible.
        </GlassPanel>
      </div>
    );
  }

  const maxMarks = assignment?.maxMarks || 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <Link href="/submissions" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '12px' }}>
          <IconArrowLeft size={16} /> Back to submissions
        </Link>
      </div>

      {/* Submission Info Header Card */}
      <GlassPanel variant="app" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {submission.isLate ? (
                <StatusPill status="Late" label="Late Submission" />
              ) : (
                <StatusPill status={submission.status} />
              )}
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '6px' }}>
              {submission.assignmentTitle}
            </h2>

            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Submitted by: <strong>{submission.studentName}</strong>
            </div>
          </div>

          {submission.filePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => submissionsApi.downloadFile(submission.id)}
            >
              <IconDownload size={16} /> Download File Attachment
            </Button>
          )}
        </div>

        {/* Response Content */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px dashed rgba(var(--ink-rgb), 0.12)',
            fontSize: '15px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            SUBMITTED RESPONSE:
          </div>
          {submission.content || '(No text response provided)'}
        </div>
      </GlassPanel>

      {/* TEACHER / ADMIN GRADING PANEL — §16 */}
      {(role === 'Teacher' || role === 'Admin') && (
        <GradingPanel
          maxMarks={maxMarks}
          initialMarks={submission.marks}
          initialFeedback={submission.feedback}
          onSaveGrade={handleSaveGrade}
        />
      )}

      {/* STUDENT GRADE VIEW */}
      {role === 'Student' && submission.status === 'Graded' && (
        <GlassPanel variant="muted" style={{ padding: '24px', borderLeft: '4px solid var(--moss)' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--moss)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            Grade: {submission.marks} / {maxMarks}
          </div>
          {submission.feedback && (
            <div style={{ fontSize: '14.5px', color: 'var(--ink)' }}>
              <strong>Teacher Feedback:</strong> {submission.feedback}
            </div>
          )}
        </GlassPanel>
      )}

      {/* SUBMISSION HISTORY ACCORDION — §16 */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
          Audit & Edit History
        </h3>
        <SubmissionHistory history={history} />
      </div>
    </div>
  );
}
