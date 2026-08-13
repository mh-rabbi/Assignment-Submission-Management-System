'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function HeroSection() {
  const scrollToFlow = () => {
    const el = document.getElementById('flow');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero wrap">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">A system of record for assignments</p>
          <h1>Every assignment. Every submission. One ledger everyone can trust.</h1>
          <p className="sub">
            Admins set up classes and teachers. Teachers publish assignments and grade work.
            Students submit before the deadline — or after, if it's allowed. Nothing gets lost,
            nothing gets faked.
          </p>
          <div className="hero-actions">
            <Link href="/auth">
              <Button variant="primary" size="lg">
                Wanna join the system?
              </Button>
            </Link>
            <Button variant="ghost" size="lg" onClick={scrollToFlow}>
              See how it works
            </Button>
          </div>
        </div>

        {/* Ledger Card floating mockup */}
        <div className="glass ledger-card">
          <div className="ledger-row">
            <span>Algebra Homework 1</span>
            <span className="pill pill-published">Published</span>
          </div>
          <div className="ledger-row">
            <span>Chapter 4 Essay</span>
            <span className="pill pill-draft">Draft</span>
          </div>
          <div className="ledger-row">
            <span>Student One — submission</span>
            <span className="pill pill-graded">Graded 92/100</span>
          </div>
          <div className="ledger-row">
            <span>Student Two — submission</span>
            <span className="pill pill-late">Late, accepted</span>
          </div>
          <div className="ledger-row">
            <span>Lab Report 3</span>
            <span className="pill pill-closed">Closed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
