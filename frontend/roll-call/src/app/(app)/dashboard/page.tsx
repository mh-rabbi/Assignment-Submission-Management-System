'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  classesApi,
  subjectsApi,
  assignmentsApi,
  submissionsApi,
} from '@/lib/api';
import type {
  ClassDto,
  SubjectDto,
  AssignmentDto,
  SubmissionDto,
} from '@/lib/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  IconSchool,
  IconBook,
  IconFileText,
  IconFileUpload,
  IconAlertCircle,
  IconPlus,
} from '@tabler/icons-react';

export default function DashboardPage() {
  const { auth, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (role === 'Admin') {
          const [cList, sList, aList, subList] = await Promise.all([
            classesApi.list().catch(() => []),
            subjectsApi.list().catch(() => []),
            assignmentsApi.list().catch(() => []),
            submissionsApi.list().catch(() => []),
          ]);
          setClasses(cList);
          setSubjects(sList);
          setAssignments(aList);
          setSubmissions(subList);
        } else if (role === 'Teacher') {
          const [aList, subList] = await Promise.all([
            assignmentsApi.list().catch(() => []),
            submissionsApi.list().catch(() => []),
          ]);
          setAssignments(aList);
          setSubmissions(subList);
        } else if (role === 'Student') {
          const [aList, subList] = await Promise.all([
            assignmentsApi.list().catch(() => []),
            submissionsApi.mine().catch(() => []),
          ]);
          setAssignments(aList);
          setSubmissions(subList);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [role]);

  // Derived metrics
  const activeAssignmentsCount = assignments.filter(
    (a) => a.status === 'Published'
  ).length;

  const ungradedCount = submissions.filter(
    (s) => s.status === 'Submitted'
  ).length;

  const submissionsThisWeek = submissions.filter((s) => {
    const d = new Date(s.submittedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return d >= oneWeekAgo;
  }).length;

  // Student due-soon list (published assignments sorted by deadline)
  const dueSoon = [...assignments]
    .filter((a) => a.status === 'Published')
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <Skeleton height="90px" borderRadius="14px" />
          <Skeleton height="90px" borderRadius="14px" />
          <Skeleton height="90px" borderRadius="14px" />
          <Skeleton height="90px" borderRadius="14px" />
        </div>
        <Skeleton height="200px" borderRadius="14px" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <GlassPanel variant="app" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                marginBottom: '6px',
              }}
            >
              Welcome back, {auth?.name || auth?.email}!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Logged in as <strong style={{ textTransform: 'capitalize' }}>{role}</strong>. Here's your overview.
            </p>
          </div>
          {role === 'Teacher' && (
            <Link href="/assignments">
              <Button variant="primary">
                <IconPlus size={18} /> Create Assignment
              </Button>
            </Link>
          )}
        </div>
      </GlassPanel>

      {/* ADMIN DASHBOARD VIEW — §17 */}
      {role === 'Admin' && (
        <>
          {/* Metric Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <GlassPanel variant="muted" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IconSchool size={32} style={{ color: 'var(--moss)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {classes.length}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Classes</div>
              </div>
            </GlassPanel>

            <GlassPanel variant="muted" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IconBook size={32} style={{ color: 'var(--moss)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {subjects.length}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Subjects</div>
              </div>
            </GlassPanel>

            <GlassPanel variant="muted" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IconFileText size={32} style={{ color: 'var(--moss)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {activeAssignmentsCount}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Published</div>
              </div>
            </GlassPanel>

            <GlassPanel variant="muted" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IconFileUpload size={32} style={{ color: 'var(--moss)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {submissionsThisWeek}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Submissions (This Week)</div>
              </div>
            </GlassPanel>
          </div>

          {/* Recent Submissions Table */}
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
              Recent Submissions System-Wide
            </h3>
            <GlassPanel variant="app" style={{ padding: 0, overflow: 'hidden' }}>
              {submissions.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No submissions in the system yet.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Student</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.slice(0, 5).map((sub) => (
                      <tr key={sub.id}>
                        <td>{sub.assignmentTitle}</td>
                        <td>{sub.studentName}</td>
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
                          {sub.marks !== null ? `${sub.marks}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassPanel>
          </div>
        </>
      )}

      {/* TEACHER DASHBOARD VIEW — §17 */}
      {role === 'Teacher' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <GlassPanel variant="muted" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IconFileText size={32} style={{ color: 'var(--moss)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {assignments.length}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>My Assignments</div>
              </div>
            </GlassPanel>

            <GlassPanel
              variant="muted"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: ungradedCount > 0 ? '1px solid rgba(180, 85, 47, 0.35)' : undefined,
                background: ungradedCount > 0 ? 'rgba(180, 85, 47, 0.05)' : undefined,
              }}
            >
              <IconAlertCircle
                size={32}
                style={{ color: ungradedCount > 0 ? 'var(--stamp)' : 'var(--moss)' }}
              />
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: ungradedCount > 0 ? 'var(--stamp)' : undefined,
                  }}
                >
                  {ungradedCount}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Ungraded Submissions Needing Attention
                </div>
              </div>
            </GlassPanel>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-display)' }}>
                Recent Submissions to Grade
              </h3>
              <Link href="/submissions" style={{ fontSize: '14px' }}>
                View all →
              </Link>
            </div>

            <GlassPanel variant="app" style={{ padding: 0, overflow: 'hidden' }}>
              {submissions.filter((s) => s.status === 'Submitted').length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  All submitted work has been graded! 🎉
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Student</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .filter((s) => s.status === 'Submitted')
                      .slice(0, 5)
                      .map((sub) => (
                        <tr key={sub.id}>
                          <td>{sub.assignmentTitle}</td>
                          <td>{sub.studentName}</td>
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
                          <td>
                            <Link href={`/submissions/${sub.id}`}>
                              <Button variant="ghost" size="sm">
                                Grade
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
        </>
      )}

      {/* STUDENT DASHBOARD VIEW — §17 */}
      {role === 'Student' && (
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
            Due Soon (Published Assignments in Your Class)
          </h3>

          <GlassPanel variant="app" style={{ padding: 0, overflow: 'hidden' }}>
            {dueSoon.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                Nothing published to your class right now.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Deadline</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dueSoon.map((ass) => {
                    const isPast = new Date(ass.deadline) < new Date();
                    return (
                      <tr key={ass.id}>
                        <td style={{ fontWeight: 500 }}>{ass.title}</td>
                        <td>{ass.subjectName}</td>
                        <td>{ass.teacherName}</td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            color: isPast ? 'var(--stamp)' : undefined,
                          }}
                        >
                          {new Date(ass.deadline).toLocaleString()}
                        </td>
                        <td>
                          <Link href={`/assignments/${ass.id}`}>
                            <Button variant="primary" size="sm">
                              View Brief
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
