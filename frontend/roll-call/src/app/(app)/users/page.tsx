'use client';

import { useState, useEffect, useCallback } from 'react';
import { usersApi, classesApi, ApiException } from '@/lib/api';
import type { UserDto, ClassDto, Role, CreateUserRequest, UpdateUserRequest } from '@/lib/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill, RoleStamp } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { IconPlus, IconEdit, IconUserX } from '@tabler/icons-react';

export default function UsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Student');
  const [classId, setClassId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uList, cList] = await Promise.all([
        usersApi.list(),
        classesApi.list().catch(() => []),
      ]);
      setUsers(uList);
      setClasses(cList);
    } catch {
      showToast('Failed to load users directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('Student');
    setClassId('');
    setFormError(null);
    setSelectedUser(null);
  };

  const handleCreateSubmit = async () => {
    setFormError(null);
    setSubmitting(true);

    try {
      const req: CreateUserRequest = {
        name,
        email,
        password,
        role,
        classId: role === 'Student' ? classId || null : null,
      };
      await usersApi.create(req);
      showToast('User created.');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to create user.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user: UserDto) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setClassId(user.classId || '');
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const req: UpdateUserRequest = {
        name,
        email,
        classId: selectedUser.role === 'Student' ? classId || null : null,
      };
      if (password.trim()) {
        req.password = password;
      }
      await usersApi.update(selectedUser.id, req);
      showToast('User updated.');
      setIsEditOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiException) {
        setFormError(err.apiError.message);
      } else {
        setFormError('Failed to update user.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (user: UserDto) => {
    if (!confirm(`Are you sure you want to deactivate ${user.name}? They will no longer be able to log in.`)) {
      return;
    }

    try {
      await usersApi.delete(user.id);
      showToast('User deactivated.');
      loadData();
    } catch {
      showToast('Failed to deactivate user.', 'error');
    }
  };

  const columns: Column<UserDto>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      accessor: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RoleStamp role={r.role} size="md" />
          <span style={{ fontWeight: 500 }}>{r.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      accessor: (r) => r.email,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      accessor: (r) => (
        <span style={{ textTransform: 'capitalize', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          {r.role}
        </span>
      ),
    },
    {
      key: 'className',
      header: 'Class',
      sortable: true,
      accessor: (r) => r.className || '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      accessor: (r) => (
        <StatusPill status={r.isActive ? 'Active' : 'Inactive'} />
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
          {r.isActive && (
            <Button variant="danger" size="sm" onClick={() => handleDeactivate(r)}>
              <IconUserX size={16} /> Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '4px' }}>
            Users Directory
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Manage system users across Admin, Teacher, and Student roles.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <IconPlus size={18} /> Create User
        </Button>
      </div>

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Search users by name, email, role..."
          emptyMessage="No users found."
        />
      )}

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User"
        primaryActionLabel={submitting ? 'Creating...' : 'Create user'}
        onPrimaryAction={handleCreateSubmit}
        primaryActionDisabled={submitting}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}

          <div className="field-group">
            <label className="field-label">Name</label>
            <input
              type="text"
              required
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@school.test"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Role</label>
            <select
              className="field-input"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>

          {role === 'Student' && (
            <div className="field-group">
              <label className="field-label">Class</label>
              <select
                className="field-input"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit User — ${selectedUser?.name}`}
        primaryActionLabel={submitting ? 'Saving...' : 'Save changes'}
        onPrimaryAction={handleEditSubmit}
        primaryActionDisabled={submitting}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="field-error">{formError}</div>}

          <div className="field-group">
            <label className="field-label">Name</label>
            <input
              type="text"
              required
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">New Password (leave blank to keep current)</label>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>

          {selectedUser?.role === 'Student' && (
            <div className="field-group">
              <label className="field-label">Class</label>
              <select
                className="field-input"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
