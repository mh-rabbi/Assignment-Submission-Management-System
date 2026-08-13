'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'problem', label: 'entry 01 — why this exists' },
  { id: 'roles', label: 'entry 02 — three roles' },
  { id: 'flow', label: 'entry 03 — the flow' },
  { id: 'rules', label: 'entry 04 — the rules' },
];

export function RollCallRail() {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [tickPositions, setTickPositions] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const railEl = document.getElementById('rail');

    function positionTicks() {
      if (!railEl) return;
      const railRect = railEl.getBoundingClientRect();
      const railTop = window.scrollY + railRect.top;
      const railHeight = railRect.height || 1;

      const positions = SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return 0;
        const elTop = window.scrollY + el.getBoundingClientRect().top;
        const pct = Math.min(
          100,
          Math.max(0, ((elTop - railTop) / railHeight) * 100)
        );
        return pct;
      });

      setTickPositions(positions);
    }

    function updateActiveAndProgress() {
      const viewportMid = window.scrollY + window.innerHeight * 0.35;
      let currentIdx = -1;

      SECTIONS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el) {
          const elTop = window.scrollY + el.getBoundingClientRect().top;
          if (elTop <= viewportMid) {
            currentIdx = i;
          }
        }
      });

      setActiveIdx(currentIdx);

      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgressPct(pct);
    }

    positionTicks();
    updateActiveAndProgress();

    // Recompute ticks after fonts load/settle
    const timer = setTimeout(positionTicks, 400);

    window.addEventListener('resize', positionTicks);
    window.addEventListener('resize', updateActiveAndProgress);
    window.addEventListener('scroll', updateActiveAndProgress, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', positionTicks);
      window.removeEventListener('resize', updateActiveAndProgress);
      window.removeEventListener('scroll', updateActiveAndProgress);
    };
  }, []);

  const handleTickClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* 3px Top Progress Bar (Visible < 1180px per design §6 & §11) */}
      <div className="landing-topbar" id="topbar">
        <div
          className="topbar-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Roll Call Rail (Visible ≥ 1180px) */}
      <div className="rail" id="rail">
        {SECTIONS.map((s, i) => {
          const isActive = i === activeIdx;
          const topPct = tickPositions[i] ?? 0;

          return (
            <div
              key={s.id}
              className={`rail-tick ${isActive ? 'active' : ''}`}
              style={{ top: `${topPct}%` }}
              role="button"
              tabIndex={0}
              aria-label={`Jump to section: ${s.label}`}
              onClick={() => handleTickClick(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTickClick(s.id);
                }
              }}
            >
              <span className="rail-label">{s.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
