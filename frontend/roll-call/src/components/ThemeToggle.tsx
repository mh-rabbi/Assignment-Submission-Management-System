'use client';

/**
 * ThemeToggle — §4, §8
 * Pill button: sun (light) / moon (dark).
 * aria-pressed reflects current state.
 * Knob animates with overshoot easing (cubic-bezier(0.34, 1.56, 0.64, 1)) — §9.
 */
import { useEffect, useState } from 'react';
import { toggleTheme, getCurrentTheme } from './ThemeProvider';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getCurrentTheme() === 'dark');
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setIsDark(next === 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '52px',
        height: '28px',
        borderRadius: '999px',
        border: '1px solid rgba(var(--ink-rgb), 0.20)',
        background: 'rgba(var(--ink-rgb), 0.06)',
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background-color 240ms ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'var(--moss)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: 'var(--on-moss)',
          transform: isDark ? 'translateX(24px)' : 'translateX(0)',
          transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-hidden="true"
      >
        {isDark ? '☾' : '☀'}
      </span>
    </button>
  );
}
