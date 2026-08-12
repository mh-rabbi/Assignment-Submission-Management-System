'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherAssignmentsApi } from '@/lib/api';
import type { TeacherAssignmentDto } from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

export default function MyTeachingPage() {
  const { auth } = useAuth();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<TeacherAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!auth?.userId) return;
    setLoading(true);
    try {
      const data = await teacherAssignmentsApi.listByTeacher(auth.userId);
      setAssignments(data);
    } catch {
      showToast('Failed to load your teaching assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [auth?.userId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<TeacherAssignmentDto>[] = [
    {
      key: 'subjectName',
      header: 'Subject',
      sortable: true,
      accessor: (r) => <span style={{ fontWeight: 500 }}>{r.subjectName}</span>,
    },
    {
      key: 'className',
      header: 'Class',
      sortable: true,
      accessor: (r) => r.className,
    },
    {
      key: 'createdAt',
      header: 'Assigned At',
      sortable: true,
      accessor: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '4px' }}>
          My Teaching Assignments
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Read-only view of the subject and class combinations you are assigned to teach by an Admin.
        </p>
      </div>

      {loading ? (
        <div>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No teaching assignments found"
          description="An Admin has not assigned you to any subject or class yet. Contact your System Admin to get assigned."
        />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search my subjects or classes..."
        />
      )}
    </div>
  );
}
