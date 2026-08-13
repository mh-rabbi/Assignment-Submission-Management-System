'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { MobileTabBar } from '@/components/shell/MobileTabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { auth, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !auth) {
      router.push('/auth');
    }
  }, [auth, isLoading, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}
      >
        Loading Roll Call...
      </div>
    );
  }

  if (!auth) {
    return null; // Will redirect via useEffect
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* App-mode single stationary blob behind app shell — §13 */}
      <div
        className="blob blob-a"
        style={{
          width: '300px',
          height: '300px',
          top: '10%',
          right: '5%',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Fixed Left Sidebar (Desktop ≥900px) */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className="app-main-content"
        style={{
          marginLeft: '240px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Sticky Topbar */}
        <Topbar />

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: '32px 28px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {children}
        </main>
      </div>

      {/* Fixed Bottom Tab Bar (Mobile ≤899px) */}
      <MobileTabBar />
    </div>
  );
}
