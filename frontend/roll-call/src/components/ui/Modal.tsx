'use client';

import React, { useEffect, useRef } from 'react';
import { GlassPanel } from './GlassPanel';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  primaryActionVariant?: 'primary' | 'danger';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  primaryActionVariant = 'primary',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassPanel ref={panelRef} className="modal-panel">
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            marginBottom: '20px',
            color: 'var(--ink)',
          }}
        >
          {title}
        </h3>

        <div>{children}</div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {primaryActionLabel && onPrimaryAction && (
            <Button
              variant={primaryActionVariant}
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled}
            >
              {primaryActionLabel}
            </Button>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
