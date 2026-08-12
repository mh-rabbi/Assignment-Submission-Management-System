'use client';

import { useState, useEffect, useCallback } from 'react';
import { subjectsApi, ApiException } from '@/lib/api';
import type { SubjectDto } from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

export default function SubjectsPage() {
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDto | null>(null);

  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subjectsApi.list();
      setSubjects(data);
    } catch {
      showToast('Failed to load subjects.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName('');
    setFormError(null);
    setSelectedSubject(null);
  };

  const handleCreateSubmit = async () => {
    setFormError(null);
    setSubmitting(true);

    try {
      await subjectsApi.create({ name });
      showToast('Subject created.');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 409) {
        setFormError('A subject with that name already exists.');
      } else if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to create subject.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (subj: SubjectDto) => {
    setSelectedSubject(subj);
    setName(subj.name);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedSubject) return;
    setFormError(null);
    setSubmitting(true);

    try {
      await subjectsApi.update(selectedSubject.id, { name });
      showToast('Subject updated.');
      setIsEditOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 409) {
        setFormError('A subject with that name already exists.');
      } else if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to update subject.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (subj: SubjectDto) => {
    setSelectedSubject(subj);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedSubject) return;
    setSubmitting(true);

    try {
      await subjectsApi.delete(selectedSubject.id);
      showToast('Subject soft deleted.');
      setIsDeleteOpen(false);
      resetForm();
      loadData();
    } catch {
      showToast('Failed to delete subject.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<SubjectDto>[] = [
    {
      key: 'name',
      header: 'Subject Name',
      sortable: true,
      accessor: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      accessor: (r) => <StatusPill status={r.isActive ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'createdAt',
      header: 'Created At',
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
            <IconEdit size={16} /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => openDelete(r)}>
            <IconTrash size={16} /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '4px' }}>
            Subjects
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Manage standalone academic subjects catalog (e.g. Mathematics, Physics).
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <IconPlus size={18} /> Create Subject
        </Button>
      </div>

      {loading ? (
        <div>Loading subjects...</div>
      ) : (
        <DataTable
          columns={columns}
          data={subjects}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search subjects..."
          emptyMessage="No active subjects found."
        />
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Subject"
        primaryActionLabel={submitting ? 'Creating...' : 'Create subject'}
        onPrimaryAction={handleCreateSubmit}
        primaryActionDisabled={submitting || !name.trim()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}
          <div className="field-group">
            <label className="field-label">Subject Name</label>
            <input
              type="text"
              required
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chemistry"
            />
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Subject — ${selectedSubject?.name}`}
        primaryActionLabel={submitting ? 'Saving...' : 'Save changes'}
        onPrimaryAction={handleEditSubmit}
        primaryActionDisabled={submitting || !name.trim()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}
          <div className="field-group">
            <label className="field-label">Subject Name</label>
            <input
              type="text"
              required
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={`Delete Subject — ${selectedSubject?.name}?`}
        primaryActionLabel={submitting ? 'Deleting...' : 'Delete subject'}
        onPrimaryAction={handleDeleteSubmit}
        primaryActionVariant="danger"
        primaryActionDisabled={submitting}
      >
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
          This subject will be soft-deleted and disappear from active subject lists.
        </p>
      </Modal>
    </div>
  );
}
