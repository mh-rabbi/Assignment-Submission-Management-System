"use client";

import { useState } from "react";
import Link from "next/link";
import { useAssignments } from "@/hooks/useAssignments";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, isDeadlinePast } from "@/lib/utils";
import { UploadCloud, Search, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";

export default function AvailableAssignmentsPage() {
  const { assignments, isLoading: loadingAssignments } = useAssignments();
  const { data: mySubmissions, isLoading: loadingSubmissions } = useMySubmissions();

  const [search, setSearch] = useState("");

  const submittedMap = new Map(mySubmissions?.map((s) => [s.assignmentId, s]));

  const filteredAssignments = assignments.filter(
    (a) =>
      a.status === "Published" &&
      (a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.subjectName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Available Assignments</h1>
        <p className="text-sm text-muted-foreground">
          View all active published assignments for your class
        </p>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Grid of Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingAssignments || loadingSubmissions ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border rounded-2xl bg-card">
            No published assignments available right now.
          </div>
        ) : (
          filteredAssignments.map((a) => {
            const submission = submittedMap.get(a.id);
            const isPast = isDeadlinePast(a.deadline);
            const canSubmit = !isPast || a.allowLateSubmission || !!submission;

            return (
              <div key={a.id} className="p-6 rounded-2xl border bg-card shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
                      {a.subjectName}
                    </span>
                    {submission ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-950">
                        <CheckCircle2 className="h-3 w-3" /> Submitted
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded dark:bg-rose-950">
                        <AlertTriangle className="h-3 w-3" /> Past Deadline
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded dark:bg-amber-950">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-foreground">{a.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{a.description}</p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Deadline: <strong className={isPast ? "text-rose-600" : "text-foreground"}>{formatDateTime(a.deadline)}</strong></span>
                    <span>Max Marks: <strong className="text-foreground">{a.maxMarks}</strong></span>
                  </div>

                  {canSubmit ? (
                    <Link
                      href={`/student/assignments/${a.id}/submit`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <UploadCloud className="h-4 w-4" />
                      {submission ? "Update Submission" : "Submit Assignment"}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                    >
                      Submissions Closed
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
