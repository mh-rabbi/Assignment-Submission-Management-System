'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  teacherAssignmentsApi,
  usersApi,
  subjectsApi,
  classesApi,
  ApiException,
} from '@/lib/api';
import type {
  TeacherAssignmentDto,
  UserDto,
  SubjectDto,
  ClassDto,
  CreateTeacherAssignmentRequest,
} from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export default function TeacherAssignmentsPage() {
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<TeacherAssignmentDto[]>([]);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TeacherAssignmentDto | null>(null);

  // Form state
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [taList, uList, sList, cList] = await Promise.all([
        teacherAssignmentsApi.list(),
        usersApi.list().catch(() => []),
        subjectsApi.list().catch(() => []),
        classesApi.list().catch(() => []),
      ]);
      setAssignments(taList);
      // Filter teachers only (Role == Teacher & IsActive)
      setTeachers(uList.filter((u) => u.role === 'Teacher' && u.isActive));
      setSubjects(sList);
      setClasses(cList);
    } catch {
      showToast('Failed to load teacher assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setTeacherId('');
    setSubjectId('');
    setClassId('');
    setFormError(null);
    setSelectedRow(null);
  };

  const handleCreateSubmit = async () => {
    if (!teacherId || !subjectId || !classId) {
      setFormError('Please select a teacher, subject, and class.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const req: CreateTeacherAssignmentRequest = { teacherId, subjectId, classId };
      await teacherAssignmentsApi.create(req);
      showToast('Teacher assigned successfully.');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException && (err.statusCode === 409 || err.statusCode === 400)) {
        setFormError(err.apiError.message || 'Duplicate assignment combination.');
      } else {
        setFormError('Failed to create teacher assignment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedRow) return;
    setSubmitting(true);

    try {
      await teacherAssignmentsApi.delete(selectedRow.id);
      showToast('Teacher assignment removed.');
      setIsDeleteOpen(false);
      resetForm();
      loadData();
    } catch {
      showToast('Failed to remove assignment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<TeacherAssignmentDto>[] = [
    {
      key: 'teacherName',
      header: 'Teacher',
      sortable: true,
      accessor: (r) => <span style={{ fontWeight: 500 }}>{r.teacherName}</span>,
    },
    {
      key: 'subjectName',
      header: 'Subject',
      sortable: true,
      accessor: (r) => r.subjectName,
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
    {
      key: 'actions',
      header: 'Actions',
      accessor: (r) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setSelectedRow(r);
            setIsDeleteOpen(true);
          }}
        >
          <IconTrash size={16} /> Remove
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '4px' }}>
            Teacher Assignments
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Single source of truth for who is authorized to teach which subject to which class.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <IconPlus size={18} /> Assign Teacher
        </Button>
      </div>

      {loading ? (
        <div>Loading teacher assignments...</div>
      ) : assignments.length === 0 ? (
        /* Meaningful Empty State — §17 */
        <EmptyState
          title="No teacher assignments set up yet"
          description="No teacher is assigned to any subject or class yet — teachers cannot create assignments until a teaching assignment row exists here."
          actionLabel="Assign Teacher Now"
          onAction={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          keyExtractor={(ta) => ta.id}
          searchPlaceholder="Search by teacher, subject, class..."
          emptyMessage="No matching teacher assignments."
        />
      )}

      {/* CREATE TEACHER ASSIGNMENT MODAL (3 Dropdowns) — §17 */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Assign Teacher to Subject & Class"
        primaryActionLabel={submitting ? 'Assigning...' : 'Assign teacher'}
        onPrimaryAction={handleCreateSubmit}
        primaryActionDisabled={submitting || !teacherId || !subjectId || !classId}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}

          <div className="field-group">
            <label className="field-label">Teacher</label>
            <select
              className="field-input"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Select teacher...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Subject</label>
            <select
              className="field-input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Class</label>
            <select
              className="field-input"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Teacher Assignment?"
        primaryActionLabel={submitting ? 'Removing...' : 'Remove assignment'}
        onPrimaryAction={handleDeleteSubmit}
        primaryActionVariant="danger"
        primaryActionDisabled={submitting}
      >
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
          Are you sure you want to remove <strong>{selectedRow?.teacherName}</strong> from teaching <strong>{selectedRow?.subjectName}</strong> in <strong>{selectedRow?.className}</strong>?
        </p>
      </Modal>
    </div>
  );
}
