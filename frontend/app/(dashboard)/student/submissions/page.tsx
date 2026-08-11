"use client";

import { useState } from "react";
import { useMySubmissions, useSubmissionHistory } from "@/hooks/useSubmissions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Clock, Download, History, Award, MessageSquare, Loader2, FileText } from "lucide-react";

export default function MySubmissionsPage() {
  const { data: submissions, isLoading } = useMySubmissions();
  const [historySubmissionId, setHistorySubmissionId] = useState<string | null>(null);

  const { data: historyList, isLoading: loadingHistory } = useSubmissionHistory(
    historySubmissionId || ""
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Track submitted coursework, check grades, download files, and view edit snapshots
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Assignment</th>
                <th className="px-6 py-3.5">Submitted At</th>
                <th className="px-6 py-3.5">Timing</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Marks</th>
                <th className="px-6 py-3.5">Feedback</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading your submissions...
                  </td>
                </tr>
              ) : !submissions || submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    You have not submitted any assignments yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{sub.assignmentTitle}</td>
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
                    <td className="px-6 py-4 font-bold text-foreground">
                      {sub.marks !== null ? `${sub.marks}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {sub.feedback || "No feedback yet"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {sub.filePath && (
                        <a
                          href={`/api/backend/submissions/${sub.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Download Attached File"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setHistorySubmissionId(sub.id)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="View Submission History"
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

      {/* Submission Edit History Modal */}
      {historySubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl p-6 border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Submission Version History
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
                No edit snapshots recorded for this submission.
              </p>
            ) : (
              <div className="space-y-4">
                {historyList.map((snap, idx) => (
                  <div key={snap.id || idx} className="p-4 rounded-xl border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                      <span className="font-semibold text-foreground">Version #{idx + 1}</span>
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
