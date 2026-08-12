'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { submissionsApi, assignmentsApi } from '@/lib/api';
import type { SubmissionDto } from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { IconEye, IconDownload } from '@tabler/icons-react';

export default function SubmissionsPage() {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'Admin') {
        const data = await submissionsApi.list();
        setSubmissions(data);
      } else if (role === 'Teacher') {
        // Fetch teacher's assignments, then fetch submissions for each
        const aList = await assignmentsApi.list();
        const subPromises = aList.map((a) =>
          assignmentsApi.getSubmissions(a.id).catch(() => [])
        );
        const subArrays = await Promise.all(subPromises);
        const allTeacherSubs = subArrays.flat();
        setSubmissions(allTeacherSubs);
      } else if (role === 'Student') {
        const data = await submissionsApi.mine();
        setSubmissions(data);
      }
    } catch {
      showToast('Failed to load submissions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<SubmissionDto>[] = [
    {
      key: 'assignmentTitle',
      header: 'Assignment',
      sortable: true,
      accessor: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
          {r.assignmentTitle}
        </span>
      ),
    },
    {
      key: 'studentName',
      header: 'Student',
      sortable: true,
      accessor: (r) => r.studentName,
    },
    {
      key: 'submittedAt',
      header: 'Submitted At',
      sortable: true,
      accessor: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          {new Date(r.submittedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (r) =>
        r.isLate ? (
          <StatusPill status="Late" label="Late" />
        ) : (
          <StatusPill status={r.status} />
        ),
    },
    {
      key: 'marks',
      header: 'Grade',
      sortable: true,
      accessor: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {r.marks !== null ? `${r.marks}` : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/submissions/${r.id}`}>
            <Button variant="ghost" size="sm">
              <IconEye size={16} /> View
            </Button>
          </Link>
          {r.filePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => submissionsApi.downloadFile(r.id)}
            >
              <IconDownload size={16} /> File
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '4px' }}>
          Submissions
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {role === 'Admin' && 'System-wide submission oversight across all assignments.'}
          {role === 'Teacher' && 'Submissions received for your published assignments.'}
          {role === 'Student' && 'All assignments you have submitted.'}
        </p>
      </div>

      {loading ? (
        <div>Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description={
            role === 'Student'
              ? 'You have not submitted work for any assignment yet.'
              : 'No submissions have been received.'
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={submissions}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search submissions by student, assignment..."
        />
      )}
    </div>
  );
}
