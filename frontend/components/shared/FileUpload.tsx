"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
}

export function FileUpload({
  file,
  onFileSelect,
  accept = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "image/*": [".png", ".jpg", ".jpeg"],
  },
  maxSizeMB = 10,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="w-full space-y-2">
      {file ? (
        <div className="flex items-center justify-between p-3.5 border rounded-lg bg-card shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <File className="h-5 w-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-full bg-accent text-accent-foreground">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the file here..." : "Drag & drop a file here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOC, DOCX, TXT, PNG, JPG (Max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
