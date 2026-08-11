"use client";

import { useState } from "react";
import {
  useSubmissions,
  useGradeSubmission,
  useSubmissionHistory,
} from "@/hooks/useSubmissions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { SubmissionDto } from "@/types/api";
import { CheckSquare, Download, History, Award, MessageSquare, Loader2, FileText } from "lucide-react";

export default function TeacherSubmissionsPage() {
  const { data: submissions, isLoading } = useSubmissions();
  const { mutateAsync: gradeSubmission, isPending: isGrading } = useGradeSubmission();

  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDto | null>(null);
  const [historySubmissionId, setHistorySubmissionId] = useState<string | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  const { data: historyList, isLoading: loadingHistory } = useSubmissionHistory(
    historySubmissionId || ""
  );

  const handleOpenGradeModal = (sub: SubmissionDto) => {
    setSelectedSubmission(sub);
    setMarks(sub.marks ?? 0);
    setFeedback(sub.feedback ?? "");
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      await gradeSubmission({
        id: selectedSubmission.id,
        dto: {
          marks: Number(marks),
          feedback,
        },
      });
      setSelectedSubmission(null);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grade Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Review student coursework, download attached files, inspect edit histories, and award marks
        </p>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Assignment</th>
                <th className="px-6 py-3.5">Submitted At</th>
                <th className="px-6 py-3.5">Late?</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Marks</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading submissions...
                  </td>
                </tr>
              ) : !submissions || submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No submissions available for grading.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{sub.studentName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{sub.assignmentTitle}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDateTime(sub.submittedAt)}</td>
                    <td className="px-6 py-4">
                      {sub.isLate ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Late
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          On Time
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {sub.marks !== null ? `${sub.marks}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenGradeModal(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Award className="h-3.5 w-3.5" /> Grade
                      </button>
                      <button
                        onClick={() => setHistorySubmissionId(sub.id)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="View Edit History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Modal Dialog */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-card rounded-2xl p-6 border shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-xl font-bold">Grade Submission</h2>
                <p className="text-xs text-muted-foreground">
                  Student: <span className="font-semibold text-foreground">{selectedSubmission.studentName}</span> | Assignment: {selectedSubmission.assignmentTitle}
                </p>
              </div>
              <StatusBadge status={selectedSubmission.status} />
            </div>

            {/* Content view */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Submitted Text Content</label>
              <div className="p-4 rounded-xl bg-muted/40 border text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                {selectedSubmission.content || "No text content submitted."}
              </div>
            </div>

            {/* Attached file download if exists */}
            {selectedSubmission.filePath && (
              <div className="p-3.5 rounded-xl border bg-accent/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Attached File Submission</span>
                </div>
                <a
                  href={`/api/backend/submissions/${selectedSubmission.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Download File
                </a>
              </div>
            )}

            {/* Grading Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2 border-t">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Awarded Marks</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={1000}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Feedback Comments</label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
                >
                  {isGrading ? "Submitting Grade..." : "Save Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submission Edit History Modal */}
      {historySubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl p-6 border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Submission Edit History
              </h2>
              <button
                onClick={() => setHistorySubmissionId(null)}
                className="text-xs font-semibold px-2 py-1 rounded border hover:bg-accent"
              >
                Close
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading history...
              </div>
            ) : !historyList || historyList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No edit history snapshots recorded for this submission.
              </p>
            ) : (
              <div className="space-y-4">
                {historyList.map((snap, idx) => (
                  <div key={snap.id || idx} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                      <span className="font-semibold text-foreground">Snapshot #{idx + 1}</span>
                      <span>{formatDateTime(snap.editedAt)}</span>
                    </div>
                    <p className="text-xs font-mono whitespace-pre-wrap bg-background p-2 rounded border">
                      {snap.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
