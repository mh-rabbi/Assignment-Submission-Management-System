'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  assignmentsApi,
  teacherAssignmentsApi,
  submissionsApi,
  classesApi,
  subjectsApi,
  usersApi,
  ApiException,
} from '@/lib/api';
import type {
  AssignmentDto,
  TeacherAssignmentDto,
  SubmissionDto,
  ClassDto,
  SubjectDto,
  UserDto,
  CreateAssignmentRequest,
} from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { IconPlus, IconEye } from '@tabler/icons-react';

export default function AssignmentsPage() {
  const { auth, role } = useAuth();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [mySubmissions, setMySubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Filter Tab (Admin / Teacher)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Assignment Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentDto[]>([]);
  const [adminTeachers, setAdminTeachers] = useState<UserDto[]>([]);
  const [allClasses, setAllClasses] = useState<ClassDto[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectDto[]>([]);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'Student') {
        const [aList, subList] = await Promise.all([
          assignmentsApi.list(),
          submissionsApi.mine().catch(() => []),
        ]);
        setAssignments(aList);
        setMySubmissions(subList);
      } else {
        const aList = await assignmentsApi.list();
        setAssignments(aList);
      }
    } catch {
      showToast('Failed to load assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load teacher assignment combos when opening Create modal
  const openCreateModal = async () => {
    setFormError(null);
    setTitle('');
    setDescription('');
    setSelectedSubjectId('');
    setSelectedClassId('');
    setSelectedTeacherId('');
    setDeadline('');
    setMaxMarks(100);
    setAllowLateSubmission(false);

    try {
      if (role === 'Teacher' && auth?.userId) {
        // Fetch teacher's own Subject/Class combinations — §17
        const taList = await teacherAssignmentsApi.listByTeacher(auth.userId);
        setTeacherAssignments(taList);
      } else if (role === 'Admin') {
        const [taList, uList, cList, sList] = await Promise.all([
          teacherAssignmentsApi.list(),
          usersApi.list(),
          classesApi.list(),
          subjectsApi.list(),
        ]);
        setTeacherAssignments(taList);
        setAdminTeachers(uList.filter((u) => u.role === 'Teacher' && u.isActive));
        setAllClasses(cList);
        setAllSubjects(sList);
      }
      setIsCreateOpen(true);
    } catch {
      showToast('Failed to prepare creation form.', 'error');
    }
  };

  // Filter available subjects/classes client-side based on TeacherSubjectClass rows — §17
  const availableSubjectIds = Array.from(
    new Set(
      teacherAssignments
        .filter((ta) => (role === 'Admin' && selectedTeacherId ? ta.teacherId === selectedTeacherId : true))
        .map((ta) => ta.subjectId)
    )
  );

  // Deduplicate by classId — a teacher can be assigned to the same class for
  // multiple subjects, which would produce duplicate classId entries (and React
  // duplicate-key warnings). We only need one entry per unique class here.
  const availableClassesForSubject = Array.from(
    new Map(
      teacherAssignments
        .filter(
          (ta) =>
            (role === 'Admin' && selectedTeacherId ? ta.teacherId === selectedTeacherId : true) &&
            (selectedSubjectId ? ta.subjectId === selectedSubjectId : true)
        )
        .map((ta) => [ta.classId, ta])
    ).values()
  );

  const handleCreateSubmit = async () => {
    if (!title || !description || !selectedSubjectId || !selectedClassId || !deadline) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (role === 'Admin' && !selectedTeacherId) {
      setFormError('Admin must select a teacher for the assignment.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const req: CreateAssignmentRequest = {
        title,
        description,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        teacherId: role === 'Admin' ? selectedTeacherId : null,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        allowLateSubmission,
      };

      await assignmentsApi.create(req);
      showToast('Assignment created in Draft state.');
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to create assignment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter assignments by status tab
  const filteredAssignments = assignments.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  // Table columns
  const columns: Column<AssignmentDto>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.className}</div>
        </div>
      ),
    },
    {
      key: 'subjectName',
      header: 'Subject',
      sortable: true,
      accessor: (r) => r.subjectName,
    },
    {
      key: 'teacherName',
      header: 'Teacher',
      sortable: true,
      accessor: (r) => r.teacherName,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: true,
      accessor: (r) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: new Date(r.deadline) < new Date() ? 'var(--stamp)' : undefined,
          }}
        >
          {new Date(r.deadline).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'maxMarks',
      header: 'Max Marks',
      sortable: true,
      accessor: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{r.maxMarks}</span>
      ),
    },
    {
      key: 'status',
      header: role === 'Student' ? 'My Status' : 'Status',
      sortable: true,
      accessor: (r) => {
        if (role === 'Student') {
          // Derive Student status — §17
          const sub = mySubmissions.find((s) => s.assignmentId === r.id);
          if (!sub) return <StatusPill status="Not submitted" />;
          if (sub.status === 'Graded') return <StatusPill status="Graded" label={`Graded (${sub.marks}/${r.maxMarks})`} />;
          if (sub.isLate) return <StatusPill status="Late" label="Late Submission" />;
          return <StatusPill status="Submitted" />;
        }
        return <StatusPill status={r.status} />;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (r) => (
        <Link href={`/assignments/${r.id}`}>
          <Button variant="ghost" size="sm">
            <IconEye size={16} /> View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '4px' }}>
            Assignments
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {role === 'Admin' && 'System-wide assignment oversight across all classes.'}
            {role === 'Teacher' && 'Your created assignments, drafts, and submissions.'}
            {role === 'Student' && 'Published assignments for your class.'}
          </p>
        </div>

        {(role === 'Teacher' || role === 'Admin') && (
          <Button variant="primary" onClick={openCreateModal}>
            <IconPlus size={18} /> Create Assignment
          </Button>
        )}
      </div>

      {/* Filter Tabs for Admin/Teacher */}
      {role !== 'Student' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'Draft', 'Published', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                color: statusFilter === st ? 'var(--moss)' : 'var(--text-secondary)',
                background: statusFilter === st ? 'rgba(63, 125, 87, 0.12)' : 'transparent',
                border: statusFilter === st ? '1px solid rgba(63, 125, 87, 0.30)' : '1px solid transparent',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div>Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description={
            role === 'Student'
              ? 'You have no published assignments in your class right now.'
              : 'You have not created any assignments matching this filter.'
          }
          actionLabel={role !== 'Student' ? 'Create Assignment' : undefined}
          onAction={role !== 'Student' ? openCreateModal : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAssignments}
          keyExtractor={(a) => a.id}
          searchPlaceholder="Search assignments..."
        />
      )}

      {/* CREATE ASSIGNMENT MODAL — §17 */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Assignment"
        primaryActionLabel={submitting ? 'Creating...' : 'Create assignment (Draft)'}
        onPrimaryAction={handleCreateSubmit}
        primaryActionDisabled={submitting || !title || !selectedSubjectId || !selectedClassId || !deadline}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}

          <div className="field-group">
            <label className="field-label">Title</label>
            <input
              type="text"
              required
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algebra Homework 1"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Description / Brief</label>
            <textarea
              required
              className="field-input field-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions and requirements for students..."
            />
          </div>

          {/* Admin must select Teacher — §17 */}
          {role === 'Admin' && (
            <div className="field-group">
              <label className="field-label">Assigning Teacher</label>
              <select
                className="field-input"
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  setSelectedSubjectId('');
                  setSelectedClassId('');
                }}
              >
                <option value="">Select teacher...</option>
                {adminTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Dropdown — Constrained to TeacherSubjectClass rows */}
          <div className="field-group">
            <label className="field-label">Subject</label>
            <select
              className="field-input"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedClassId('');
              }}
            >
              <option value="">Select subject...</option>
              {role === 'Teacher'
                ? Array.from(new Set(teacherAssignments.map((ta) => ta.subjectId))).map((sId) => {
                    const ta = teacherAssignments.find((t) => t.subjectId === sId);
                    return (
                      <option key={sId} value={sId}>
                        {ta?.subjectName}
                      </option>
                    );
                  })
                : availableSubjectIds.map((sId) => {
                    const subj = allSubjects.find((s) => s.id === sId);
                    return (
                      <option key={sId} value={sId}>
                        {subj?.name || sId}
                      </option>
                    );
                  })}
            </select>
          </div>

          {/* Class Dropdown — Constrained to matching TeacherSubjectClass rows */}
          <div className="field-group">
            <label className="field-label">Class</label>
            <select
              className="field-input"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={!selectedSubjectId}
            >
              <option value="">Select class...</option>
              {availableClassesForSubject.map((ta) => (
                // ta.classId is now guaranteed unique after deduplication above
                <option key={ta.classId} value={ta.classId}>
                  {ta.className}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field-group">
              <label className="field-label">Deadline</label>
              <input
                type="datetime-local"
                required
                className="field-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Max Marks</label>
              <input
                type="number"
                min={1}
                required
                className="field-input"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              id="allowLate"
              type="checkbox"
              checked={allowLateSubmission}
              onChange={(e) => setAllowLateSubmission(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="allowLate" className="field-label" style={{ cursor: 'pointer' }}>
              Allow late submissions after deadline
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
