import React from "react";
import type { Role, AssignmentStatus, SubmissionStatus } from "@/lib/types";

// ─── Role Stamp Badge ────────────────────────────────────────────────────────
interface RoleStampProps {
  role: Role | "A" | "T" | "S";
  size?: "md" | "lg";
  className?: string;
}

export function RoleStamp({ role, size = "md", className = "" }: RoleStampProps) {
  let letter = "S";
  if (role === "Admin" || role === "A") letter = "A";
  if (role === "Teacher" || role === "T") letter = "T";
  if (role === "Student" || role === "S") letter = "S";

  const sizeClass = size === "lg" ? "role-stamp-lg" : "";
  const combined = `role-stamp ${sizeClass} ${className}`.trim();

  return (
    <div className={combined} title={`Role: ${role}`}>
      {letter}
    </div>
  );
}

// ─── Status Pill ─────────────────────────────────────────────────────────────
export type PillStatus =
  | AssignmentStatus
  | SubmissionStatus
  | "Late"
  | "Active"
  | "Inactive"
  | "Not submitted";

interface StatusPillProps {
  status: PillStatus;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className = "" }: StatusPillProps) {
  let pillClass = "pill-draft";
  let displayLabel = label || status;

  switch (status) {
    case "Draft":
      pillClass = "pill-draft";
      break;
    case "Published":
      pillClass = "pill-published";
      break;
    case "Closed":
      pillClass = "pill-closed";
      break;
    case "Graded":
      pillClass = "pill-graded";
      break;
    case "Late":
      pillClass = "pill-late";
      break;
    case "Submitted":
      pillClass = "pill-submitted";
      break;
    case "Active":
      pillClass = "pill-active";
      break;
    case "Inactive":
      pillClass = "pill-inactive";
      break;
    case "Not submitted":
      pillClass = "pill-draft";
      break;
  }

  const combined = `pill ${pillClass} ${className}`.trim();

  return <span className={combined}>{displayLabel}</span>;
}
