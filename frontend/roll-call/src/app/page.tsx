'use client';

import { useEffect } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { RollCallRail } from '@/components/landing/RollCallRail';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { RolesSection } from '@/components/landing/RolesSection';
import { FlowSection } from '@/components/landing/FlowSection';
import { RulesSection } from '@/components/landing/RulesSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  useEffect(() => {
    // Scroll reveal IntersectionObserver — §9 & §10
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => {
      revealEls.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      {/* Background Blobs (3 ambient drift blobs — §3 & §9) */}
      <div className="blob blob-a" style={{ width: '520px', height: '520px', top: '-120px', left: '-100px', animation: 'drift1 70s cubic-bezier(.45,0,.55,1) infinite' }} />
      <div className="blob blob-b" style={{ width: '460px', height: '460px', top: '40%', right: '-140px', animation: 'drift2 85s cubic-bezier(.45,0,.55,1) infinite' }} />
      <div className="blob blob-a" style={{ width: '400px', height: '400px', bottom: '-160px', left: '30%', animation: 'drift1 95s cubic-bezier(.45,0,.55,1) infinite reverse' }} />

      {/* Signature Scroll Progress Indicator (Roll Call Rail / Topbar fallback) */}
      <RollCallRail />

      {/* Sticky Navigation */}
      <LandingNav />

      {/* Page Sections */}
      <main>
        <HeroSection />
        <ProblemSection />
        <RolesSection />
        <FlowSection />
        <RulesSection />
        <StatsSection />
        <CtaSection />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
