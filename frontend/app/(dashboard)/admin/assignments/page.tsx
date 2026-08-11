"use client";

import { useAssignments } from "@/hooks/useAssignments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";

export default function AdminAssignmentsPage() {
  const { assignments, isLoading } = useAssignments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Assignments</h1>
        <p className="text-sm text-muted-foreground">
          View all assignments created across all subjects, classes, and teachers
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Teacher</th>
                <th className="px-6 py-3.5">Deadline</th>
                <th className="px-6 py-3.5">Max Marks</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No assignments found in system.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{a.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.subjectName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.className}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.teacherName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDateTime(a.deadline)}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{a.maxMarks}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
