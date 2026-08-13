'use client';

import { useState, useEffect, useCallback } from 'react';
import { classesApi, ApiException } from '@/lib/api';
import type { ClassDto } from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

export default function ClassesPage() {
  const { showToast } = useToast();

  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);

  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classesApi.list();
      setClasses(data);
    } catch {
      showToast('Failed to load classes.', 'error');
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
    setSelectedClass(null);
  };

  const handleCreateSubmit = async () => {
    setFormError(null);
    setSubmitting(true);

    try {
      await classesApi.create({ name });
      showToast('Class created.');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 409) {
        setFormError('A class with that name already exists.');
      } else if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to create class.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (cls: ClassDto) => {
    setSelectedClass(cls);
    setName(cls.name);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedClass) return;
    setFormError(null);
    setSubmitting(true);

    try {
      await classesApi.update(selectedClass.id, { name });
      showToast('Class updated.');
      setIsEditOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 409) {
        setFormError('A class with that name already exists.');
      } else if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to update class.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (cls: ClassDto) => {
    setSelectedClass(cls);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedClass) return;
    setSubmitting(true);

    try {
      await classesApi.delete(selectedClass.id);
      showToast('Class soft deleted.');
      setIsDeleteOpen(false);
      resetForm();
      loadData();
    } catch {
      showToast('Failed to delete class.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<ClassDto>[] = [
    {
      key: 'name',
      header: 'Class Name',
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
            Classes
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Manage active school classes (e.g. Grade 10, Grade 11).
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <IconPlus size={18} /> Create Class
        </Button>
      </div>

      {loading ? (
        <div>Loading classes...</div>
      ) : (
        <DataTable
          columns={columns}
          data={classes}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search classes..."
          emptyMessage="No active classes found."
        />
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Class"
        primaryActionLabel={submitting ? 'Creating...' : 'Create class'}
        onPrimaryAction={handleCreateSubmit}
        primaryActionDisabled={submitting || !name.trim()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}
          <div className="field-group">
            <label className="field-label">Class Name</label>
            <input
              type="text"
              required
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grade 12"
            />
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Class — ${selectedClass?.name}`}
        primaryActionLabel={submitting ? 'Saving...' : 'Save changes'}
        onPrimaryAction={handleEditSubmit}
        primaryActionDisabled={submitting || !name.trim()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}
          <div className="field-group">
            <label className="field-label">Class Name</label>
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

      {/* SOFT DELETE CONFIRMATION MODAL — §17 */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={`Delete Class — ${selectedClass?.name}?`}
        primaryActionLabel={submitting ? 'Deleting...' : 'Delete class'}
        onPrimaryAction={handleDeleteSubmit}
        primaryActionVariant="danger"
        primaryActionDisabled={submitting}
      >
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
          Students in this class won't lose their data, but the class will disappear from active dropdowns and lists.
        </p>
      </Modal>
    </div>
  );
}
