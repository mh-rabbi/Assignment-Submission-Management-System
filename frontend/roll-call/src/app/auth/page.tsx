'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authApi, classesApi, ApiException } from '@/lib/api';
import type { ClassDto, Role } from '@/lib/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { RoleStamp } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, auth } = useAuth();

  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [classes, setClasses] = useState<ClassDto[]>([]);

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('Student');
  const [regClassId, setRegClassId] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regFieldErrors, setRegFieldErrors] = useState<string[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (auth) {
      router.push('/dashboard');
    }
  }, [auth, router]);

  // Fetch classes for Student registration dropdown
  useEffect(() => {
    classesApi
      .list()
      .then(setClasses)
      .catch(() => {
        // Silently ignore if unauthenticated API call fails for classes list
      });
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });
      signIn(res);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 401) {
        setLoginError("That email or password isn't right.");
      } else if (err instanceof ApiException) {
        setLoginError(err.apiError.message || 'Login failed. Please try again.');
      } else {
        setLoginError('An unexpected error occurred.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegFieldErrors([]);
    setRegLoading(true);

    try {
      const res = await authApi.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        classId: regRole === 'Student' ? regClassId || null : null,
      });
      signIn(res);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiException) {
        setRegError(err.apiError.message);
        if (err.apiError.errors) {
          setRegFieldErrors(err.apiError.errors);
        }
      } else {
        setRegError('Registration failed. Please check your inputs.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        position: 'relative',
      }}
    >
      {/* Background Blob (1 stationary blob for auth screen — §13 & §15) */}
      <div
        className="blob blob-a"
        style={{
          width: '320px',
          height: '320px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header bar */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/" className="brand">
          <span className="stampmark">RC</span> Roll Call
        </Link>
        <ThemeToggle />
      </div>

      {/* Auth Card (440px wide per design §15) */}
      <GlassPanel
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderRadius: '12px',
            background: 'var(--glass-surface-muted)',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid rgba(var(--ink-rgb), 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('signin')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: tab === 'signin' ? 'var(--ink)' : 'var(--text-tertiary)',
              background: tab === 'signin' ? 'var(--glass-surface)' : 'transparent',
              boxShadow: tab === 'signin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: tab === 'register' ? 'var(--ink)' : 'var(--text-tertiary)',
              background: tab === 'register' ? 'var(--glass-surface)' : 'transparent',
              boxShadow: tab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            Create account
          </button>
        </div>

        {/* SIGN IN FORM */}
        {tab === 'signin' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loginError && (
              <div
                style={{
                  background: 'rgba(180, 85, 47, 0.10)',
                  border: '1px solid rgba(180, 85, 47, 0.25)',
                  color: 'var(--stamp)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}
              >
                {loginError}
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="loginEmail">
                Email
              </label>
              <input
                id="loginEmail"
                type="email"
                required
                className="field-input"
                placeholder="teacher1@school.test"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="loginPassword">
                Password
              </label>
              <input
                id="loginPassword"
                type="password"
                required
                className="field-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loginLoading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Quick Demo Credentials Help */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px dashed rgba(var(--ink-rgb), 0.12)',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                DEMO CREDENTIALS:
              </div>
              <div>Admin: admin@school.test / Admin@123</div>
              <div>Teacher: teacher1@school.test / Teacher@123</div>
              <div>Student: student1@school.test / Student@123</div>
            </div>
          </form>
        )}

        {/* CREATE ACCOUNT FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {regError && (
              <div
                style={{
                  background: 'rgba(180, 85, 47, 0.10)',
                  border: '1px solid rgba(180, 85, 47, 0.25)',
                  color: 'var(--stamp)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}
              >
                {regError}
                {regFieldErrors.length > 0 && (
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    {regFieldErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="regName">
                Full Name
              </label>
              <input
                id="regName"
                type="text"
                required
                className="field-input"
                placeholder="Jane Doe"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="regEmail">
                Email
              </label>
              <input
                id="regEmail"
                type="email"
                required
                className="field-input"
                placeholder="jane@school.test"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="regPassword">
                Password
              </label>
              <input
                id="regPassword"
                type="password"
                required
                minLength={6}
                className="field-input"
                placeholder="At least 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            {/* Role segmented control with RoleStamp visuals — §15 */}
            <div className="field-group">
              <label className="field-label">Select Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {(['Admin', 'Teacher', 'Student'] as Role[]).map((r) => {
                  const selected = regRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegRole(r)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: selected
                          ? '2px solid var(--moss)'
                          : '1px solid rgba(var(--ink-rgb), 0.12)',
                        background: selected
                          ? 'rgba(63, 125, 87, 0.08)'
                          : 'var(--glass-surface-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 180ms ease',
                      }}
                    >
                      <RoleStamp role={r} />
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: selected ? 'var(--moss)' : 'var(--ink)',
                        }}
                      >
                        {r}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Class dropdown — ONLY rendered when Role == Student (§15) */}
            {regRole === 'Student' && (
              <div className="field-group">
                <label className="field-label" htmlFor="regClass">
                  Class <span style={{ color: 'var(--stamp)' }}>*</span>
                </label>
                <select
                  id="regClass"
                  required
                  className="field-input"
                  value={regClassId}
                  onChange={(e) => setRegClassId(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="field-hint">Only students belong to a class.</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={regLoading}
              style={{ width: '100%', marginTop: '6px' }}
            >
              {regLoading ? 'Creating account...' : 'Create account'}
            </Button>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              Account creation is open for this demo — in production, accounts are set up by an Admin.
            </p>
          </form>
        )}
      </GlassPanel>
    </div>
  );
}
