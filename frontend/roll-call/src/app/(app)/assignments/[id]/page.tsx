'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  assignmentsApi,
  submissionsApi,
  ApiException,
} from '@/lib/api';
import type {
  AssignmentDto,
  SubmissionDto,
  SubmissionHistoryDto,
  AssignmentStatus,
} from '@/lib/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { SubmissionHistory } from '@/components/ui/SubmissionHistory';
import { useToast } from '@/components/ui/Toast';
import {
  IconArrowLeft,
  IconClock,
  IconAward,
  IconTrash,
  IconDownload,
  IconEdit,
} from '@tabler/icons-react';

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { auth, role } = useAuth();
  const { showToast } = useToast();

  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [studentSubmission, setStudentSubmission] = useState<SubmissionDto | null>(null);
  const [history, setHistory] = useState<SubmissionHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Submit / Edit Form State
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const ass = await assignmentsApi.get(id);
      setAssignment(ass);

      if (role === 'Teacher' || role === 'Admin') {
        const subs = await assignmentsApi.getSubmissions(id);
        setSubmissions(subs);
      } else if (role === 'Student') {
        const mySubs = await submissionsApi.mine();
        const existing = mySubs.find((s) => s.assignmentId === id);
        if (existing) {
          setStudentSubmission(existing);
          setContent(existing.content);
          // Load edit history
          const h = await submissionsApi.getHistory(existing.id).catch(() => []);
          setHistory(h);
        }
      }
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 404) {
        showToast('Assignment not found.', 'error');
      } else if (err instanceof ApiException && err.statusCode === 403) {
        showToast('You do not have access to this assignment.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, role, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lifecycle status button handler (Draft -> Published -> Closed) — §17
  const handleStatusChange = async (newStatus: AssignmentStatus) => {
    if (!assignment) return;
    try {
      const updated = await assignmentsApi.updateStatus(assignment.id, { status: newStatus });
      setAssignment(updated);
      showToast(`Assignment status changed to ${newStatus}.`);
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  // Delete assignment handler
  const handleDeleteAssignment = async () => {
    if (!assignment) return;
    if (!confirm('Are you sure you want to delete this assignment? All submissions will be deleted.')) {
      return;
    }
    try {
      await assignmentsApi.delete(assignment.id);
      showToast('Assignment deleted.');
      router.push('/assignments');
    } catch {
      showToast('Failed to delete assignment.', 'error');
    }
  };

  // Student submission form handler — multipart/form-data
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    if (!content.trim() && !file) {
      setSubmitError('Please provide text response or attach a file.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('AssignmentId', assignment.id);
      formData.append('Content', content);
      if (file) {
        formData.append('file', file);
      }

      await submissionsApi.submit(formData);
      showToast(studentSubmission ? 'Submission updated.' : 'Submission saved.');
      setIsEditing(false);
      loadData();
    } catch (err) {
      if (err instanceof ApiException) {
        setSubmitError(err.apiError.message);
      } else {
        setSubmitError('Failed to send submission.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading assignment details...</div>;
  }

  if (!assignment) {
    return (
      <div>
        <Link href="/assignments" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <IconArrowLeft size={16} /> Back to assignments
        </Link>
        <GlassPanel variant="muted" style={{ padding: '32px', textAlign: 'center' }}>
          Assignment not found or inaccessible.
        </GlassPanel>
      </div>
    );
  }

  const isClosed = assignment.status === 'Closed';
  const isPastDeadline = new Date(assignment.deadline) < new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Back Link */}
      <div>
        <Link href="/assignments" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '12px' }}>
          <IconArrowLeft size={16} /> Back to assignments
        </Link>
      </div>

      {/* Assignment Header Card */}
      <GlassPanel variant="app" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <StatusPill status={assignment.status} />
              <span style={{ fontSize: '13px', color: 'var(--moss)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {assignment.subjectName} · {assignment.className}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>
              {assignment.title}
            </h2>

            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Teacher: <strong>{assignment.teacherName}</strong>
            </div>
          </div>

          {/* Teacher/Admin Actions */}
          {(role === 'Teacher' || role === 'Admin') && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {assignment.status === 'Draft' && (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange('Published')}>
                  Publish Assignment
                </Button>
              )}
              {assignment.status === 'Published' && (
                <Button variant="ghost" size="sm" onClick={() => handleStatusChange('Closed')}>
                  Close Assignment
                </Button>
              )}
              {assignment.status === 'Closed' && (
                <Button variant="ghost" size="sm" onClick={() => handleStatusChange('Published')}>
                  Reopen (Publish)
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={handleDeleteAssignment}>
                <IconTrash size={16} /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Metadata Strip */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px dashed rgba(var(--ink-rgb), 0.12)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconClock size={16} style={{ color: isPastDeadline ? 'var(--stamp)' : 'var(--moss)' }} />
            <span>Deadline: {new Date(assignment.deadline).toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconAward size={16} style={{ color: 'var(--moss)' }} />
            <span>Max Marks: {assignment.maxMarks}</span>
          </div>

          <div>
            Late Submissions:{' '}
            <strong style={{ color: assignment.allowLateSubmission ? 'var(--moss)' : 'var(--stamp)' }}>
              {assignment.allowLateSubmission ? 'Allowed' : 'Blocked'}
            </strong>
          </div>
        </div>

        {/* Brief / Description */}
        <div style={{ marginTop: '20px', fontSize: '15.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {assignment.description}
        </div>
      </GlassPanel>

      {/* STUDENT SUBMISSION SECTION — §17 */}
      {role === 'Student' && (
        <div>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
            Your Submission
          </h3>

          {/* Form when not submitted or when in Edit mode */}
          {(!studentSubmission || isEditing) ? (
            <GlassPanel variant="app" style={{ padding: '24px' }}>
              {isClosed && (
                <div style={{ color: 'var(--stamp)', marginBottom: '16px', fontSize: '14px' }}>
                  This assignment is Closed. Submissions are no longer accepted.
                </div>
              )}

              <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {submitError && <div className="field-error">{submitError}</div>}

                <div className="field-group">
                  <label className="field-label">Written Answer / Response Text</label>
                  <textarea
                    disabled={isClosed}
                    className="field-input field-textarea"
                    rows={6}
                    placeholder="Type your response here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Attach File (Optional)</label>
                  <FileUpload
                    selectedFile={file}
                    onFileSelect={(f) => setFile(f)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting || isClosed}
                  >
                    {submitting
                      ? 'Submitting...'
                      : studentSubmission
                      ? 'Update Submission'
                      : 'Submit Work'}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </GlassPanel>
          ) : (
            /* Read View when already submitted */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <GlassPanel variant="app" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {studentSubmission.isLate ? (
                      <StatusPill status="Late" label="Late Submission" />
                    ) : (
                      <StatusPill status={studentSubmission.status} />
                    )}
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      Submitted: {new Date(studentSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Edit button disabled if Closed — §17 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isClosed}
                    onClick={() => setIsEditing(true)}
                  >
                    <IconEdit size={16} /> Edit submission
                  </Button>
                </div>

                {/* Grade display if graded */}
                {studentSubmission.status === 'Graded' && (
                  <GlassPanel variant="muted" style={{ padding: '16px', marginBottom: '16px', borderLeft: '4px solid var(--moss)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--moss)', fontFamily: 'var(--font-mono)' }}>
                      Grade: {studentSubmission.marks} / {assignment.maxMarks}
                    </div>
                    {studentSubmission.feedback && (
                      <div style={{ fontSize: '14px', marginTop: '6px', color: 'var(--ink)' }}>
                        Feedback: {studentSubmission.feedback}
                      </div>
                    )}
                  </GlassPanel>
                )}

                <div style={{ fontSize: '15px', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                  {studentSubmission.content}
                </div>

                {studentSubmission.filePath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => submissionsApi.downloadFile(studentSubmission.id, 'my-submission-file')}
                  >
                    <IconDownload size={16} /> Download attached file
                  </Button>
                )}
              </GlassPanel>

              {/* Submission History Accordion / List — §16 */}
              <SubmissionHistory history={history} />
            </div>
          )}
        </div>
      )}

      {/* TEACHER / ADMIN SUBMISSIONS TABLE FOR THIS ASSIGNMENT — §17 */}
      {(role === 'Teacher' || role === 'Admin') && (
        <div>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
            Student Submissions ({submissions.length})
          </h3>

          <GlassPanel variant="app" style={{ padding: 0, overflow: 'hidden' }}>
            {submissions.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No student has submitted work for this assignment yet.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submitted At</th>
                    <th>Status</th>
                    <th>Marks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 500 }}>{sub.studentName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {new Date(sub.submittedAt).toLocaleString()}
                      </td>
                      <td>
                        {sub.isLate ? (
                          <StatusPill status="Late" />
                        ) : (
                          <StatusPill status={sub.status} />
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {sub.marks !== null ? `${sub.marks} / ${assignment.maxMarks}` : '—'}
                      </td>
                      <td>
                        <Link href={`/submissions/${sub.id}`}>
                          <Button variant="ghost" size="sm">
                            {sub.status === 'Graded' ? 'View / Edit Grade' : 'Grade'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
