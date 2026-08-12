'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav>
      <div className="wrap">
        <div className="inner glass">
          <Link href="/" className="brand" onClick={closeMenu}>
            <span className="stampmark">RC</span> Roll Call
          </Link>

          <div className="navlinks">
            <a href="#problem">Product</a>
            <a href="#roles">Roles</a>
            <a href="#flow">How it works</a>
          </div>

          <div className="navright">
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="ghost" style={{ padding: '9px 18px', fontSize: '14px' }}>
                Sign in
              </Button>
            </Link>
            <button
              className="menu-btn"
              id="menuBtn"
              aria-expanded={menuOpen}
              aria-controls="mobilePanel"
              aria-label="Open menu"
              onClick={toggleMenu}
            >
              <span />
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`mobile-panel glass ${menuOpen ? 'open' : ''}`}
          id="mobilePanel"
          style={{ marginTop: '8px' }}
        >
          <div className="inner">
            <a href="#problem" onClick={closeMenu}>
              Product
            </a>
            <a href="#roles" onClick={closeMenu}>
              Roles
            </a>
            <a href="#flow" onClick={closeMenu}>
              How it works
            </a>
            <Link href="/auth" onClick={closeMenu} style={{ width: '100%' }}>
              <Button variant="primary" style={{ width: '100%', marginTop: '8px' }}>
                Wanna join the system?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
