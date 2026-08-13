'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RoleStamp } from '@/components/ui/Badge';
import type { Role } from '@/lib/types';
import {
  IconDashboard,
  IconUsers,
  IconSchool,
  IconBook,
  IconUserCheck,
  IconFileText,
  IconFileUpload,
  IconLogout,
} from '@tabler/icons-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: IconDashboard,
    roles: ['Admin', 'Teacher', 'Student'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: IconUsers,
    roles: ['Admin'],
  },
  {
    label: 'Classes',
    href: '/classes',
    icon: IconSchool,
    roles: ['Admin'],
  },
  {
    label: 'Subjects',
    href: '/subjects',
    icon: IconBook,
    roles: ['Admin'],
  },
  {
    label: 'Teacher Assignments',
    href: '/teacher-assignments',
    icon: IconUserCheck,
    roles: ['Admin'],
  },
  {
    label: 'My Teaching',
    href: '/my-teaching',
    icon: IconUserCheck,
    roles: ['Teacher'],
  },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: IconFileText,
    roles: ['Admin', 'Teacher', 'Student'],
  },
  {
    label: 'Submissions',
    href: '/submissions',
    icon: IconFileUpload,
    roles: ['Admin', 'Teacher', 'Student'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { auth, role, signOut } = useAuth();

  if (!role) return null;

  // Filter items per role — inapplicable items do NOT render in DOM (§14)
  const allowedItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className="glass-app"
      style={{
        width: '240px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        borderRadius: 0, // full left screen height
        borderRight: '1px solid rgba(var(--ink-rgb), 0.10)',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
      }}
    >
      <div>
        {/* Brand header */}
        <Link
          href="/dashboard"
          className="brand"
          style={{ paddingLeft: '8px', marginBottom: '32px', display: 'flex' }}
        >
          <span className="stampmark">RC</span> Roll Call
        </Link>

        {/* Role-filtered Nav List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {allowedItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  height: '44px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  color: isActive ? 'var(--moss)' : 'var(--ink)',
                  background: isActive ? 'var(--glass-surface-muted)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--moss)' : '2px solid transparent',
                  opacity: isActive ? 1 : 0.8,
                  transition: 'all 180ms ease',
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: User info + Sign out */}
      <div
        style={{
          paddingTop: '16px',
          borderTop: '1px solid rgba(var(--ink-rgb), 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RoleStamp role={role} size="md" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {auth?.name || auth?.email || 'User'}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                textTransform: 'capitalize',
              }}
            >
              {role}
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            padding: '6px 8px',
            borderRadius: '6px',
            transition: 'color 180ms ease',
          }}
          className="btn-ghost"
        >
          <IconLogout size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
