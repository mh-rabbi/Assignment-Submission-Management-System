'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/lib/types';
import {
  IconDashboard,
  IconUsers,
  IconSchool,
  IconBook,
  IconUserCheck,
  IconFileText,
  IconFileUpload,
} from '@tabler/icons-react';

interface TabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: Role[];
}

const TAB_ITEMS: TabItem[] = [
  { label: 'Dash', href: '/dashboard', icon: IconDashboard, roles: ['Admin', 'Teacher', 'Student'] },
  { label: 'Users', href: '/users', icon: IconUsers, roles: ['Admin'] },
  { label: 'Classes', href: '/classes', icon: IconSchool, roles: ['Admin'] },
  { label: 'Subjects', href: '/subjects', icon: IconBook, roles: ['Admin'] },
  { label: 'Assign', href: '/teacher-assignments', icon: IconUserCheck, roles: ['Admin'] },
  { label: 'Teaching', href: '/my-teaching', icon: IconUserCheck, roles: ['Teacher'] },
  { label: 'Tasks', href: '/assignments', icon: IconFileText, roles: ['Admin', 'Teacher', 'Student'] },
  { label: 'Work', href: '/submissions', icon: IconFileUpload, roles: ['Admin', 'Teacher', 'Student'] },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { role } = useAuth();

  if (!role) return null;

  // Filter allowed items for role (max 5 for mobile space)
  const allowed = TAB_ITEMS.filter((t) => t.roles.includes(role)).slice(0, 5);

  return (
    <div
      className="mobile-tab-bar glass-app"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        zIndex: 50,
        display: 'none', // Shown via CSS media query @media (max-width: 899px)
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTop: '1px solid rgba(var(--ink-rgb), 0.12)',
        borderRadius: 0,
        padding: '0 8px',
      }}
    >
      {allowed.map((item) => {
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              flex: 1,
              height: '100%',
              fontSize: '11px',
              fontWeight: 500,
              color: isActive ? 'var(--moss)' : 'var(--text-tertiary)',
            }}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
