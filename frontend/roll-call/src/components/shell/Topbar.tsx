'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

// Route title mapping
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Users Directory',
  '/classes': 'Classes',
  '/subjects': 'Subjects',
  '/teacher-assignments': 'Teacher Assignments',
  '/my-teaching': 'My Teaching',
  '/assignments': 'Assignments',
  '/submissions': 'Submissions',
};

export function Topbar() {
  const pathname = usePathname();
  const { auth } = useAuth();

  // Find page title
  let title = 'Roll Call';
  for (const [route, t] of Object.entries(PAGE_TITLES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      title = t;
      break;
    }
  }

  const initial = (auth?.name || auth?.email || 'U')[0].toUpperCase();

  return (
    <header
      className="glass-app"
      style={{
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        borderRadius: 0,
        borderBottom: '1px solid rgba(var(--ink-rgb), 0.10)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
      }}
    >
      {/* Page Title (Fraunces Display M, 24px per §13 & §14) */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 560,
          color: 'var(--ink)',
        }}
      >
        {title}
      </h1>

      {/* Topbar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ThemeToggle />

        {/* User avatar pill */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--glass-surface-muted)',
            border: '1px solid rgba(var(--ink-rgb), 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--moss)',
          }}
          title={auth?.name || auth?.email}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
