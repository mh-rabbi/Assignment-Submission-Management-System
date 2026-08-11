"use client";

import type { AssignmentStatus, SubmissionStatus, Role } from "@/types/api";

interface StatusBadgeProps {
  status: AssignmentStatus | SubmissionStatus | Role | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let badgeStyles = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";

  switch (status) {
    // Assignment Statuses
    case "Draft":
      badgeStyles = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      break;
    case "Published":
      badgeStyles = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
      break;
    case "Closed":
      badgeStyles = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900";
      break;

    // Submission Statuses
    case "Submitted":
      badgeStyles = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900";
      break;
    case "Graded":
      badgeStyles = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900";
      break;

    // Roles
    case "Admin":
      badgeStyles = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900";
      break;
    case "Teacher":
      badgeStyles = "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-900";
      break;
    case "Student":
      badgeStyles = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles} ${className}`}
    >
      {status}
    </span>
  );
}
