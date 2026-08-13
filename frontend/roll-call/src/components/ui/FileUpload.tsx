'use client';

import React, { useState, useRef } from 'react';
import { GlassPanel } from './GlassPanel';
import { IconUpload, IconFile, IconX } from '@tabler/icons-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        accept=".pdf,.docx,.doc,.zip,.png,.jpg,.jpeg"
        onChange={handleInputChange}
      />

      {!selectedFile ? (
        <GlassPanel
          variant="muted"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '24px',
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: '1.5px',
            borderColor: isDragging ? 'var(--moss)' : 'rgba(var(--ink-rgb), 0.20)',
            background: isDragging ? 'rgba(63, 125, 87, 0.08)' : undefined,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          <IconUpload
            size={32}
            style={{ color: 'var(--moss)', marginBottom: '8px' }}
          />
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>
            Drag and drop your file here, or <span style={{ color: 'var(--moss)' }}>browse</span>
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              marginTop: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Allowed formats: .pdf, .docx, .doc, .zip, .png, .jpg, .jpeg (max 10MB)
          </div>
        </GlassPanel>
      ) : (
        <GlassPanel
          variant="muted"
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconFile size={22} style={{ color: 'var(--moss)' }} />
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  wordBreak: 'break-all',
                }}
              >
                {selectedFile.name}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onFileSelect(null)}
            style={{
              padding: '6px',
              borderRadius: '50%',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Remove file"
          >
            <IconX size={18} />
          </button>
        </GlassPanel>
      )}
    </div>
  );
}
