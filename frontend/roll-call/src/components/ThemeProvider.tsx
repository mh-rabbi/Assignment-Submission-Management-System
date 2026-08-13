'use client';

/**
 * ThemeProvider — §4
 * Reads localStorage 'theme' or prefers-color-scheme, writes data-theme to <html>.
 * Must be a Client Component because it uses localStorage and window.matchMedia.
 * Renders children with no wrapper element — purely side-effect driven.
 */
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  return <>{children}</>;
}

/**
 * Toggle between light and dark.
 * Called by ThemeToggle component.
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  return next;
}

export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light';
}
