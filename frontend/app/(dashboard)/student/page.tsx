"use client";

import Link from "next/link";
import { useAssignments } from "@/hooks/useAssignments";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatDateTime, isDeadlinePast } from "@/lib/utils";
import { FileText, Clock, CheckCircle2, ArrowRight, UploadCloud, Loader2 } from "lucide-react";

export default function StudentDashboardPage() {
  const { assignments, isLoading: loadingAssignments } = useAssignments();
  const { data: submissions, isLoading: loadingSubmissions } = useMySubmissions();

  const publishedAssignments = assignments.filter((a) => a.status === "Published");
  const mySubmittedIds = new Set(submissions?.map((s) => s.assignmentId) || []);

  const pendingAssignments = publishedAssignments.filter((a) => !mySubmittedIds.has(a.id));
  const gradedSubmissions = submissions?.filter((s) => s.status === "Graded") || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
          <p className="text-sm text-muted-foreground">
            Track published assignments, submit coursework, and inspect teacher feedback
          </p>
        </div>
        <Link
          href="/student/assignments"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:scale-105"
        >
          <FileText className="h-4 w-4" /> View Assignments
        </Link>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Pending Assignments</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground">{pendingAssignments.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Assignments awaiting your response</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Total Submitted</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground">{submissions?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Submitted coursework</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Graded Work</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground">{gradedSubmissions.length}</div>
            <div className="text-xs text-muted-foreground mt-1">With teacher marks & feedback</div>
          </div>
        </div>
      </div>

      {/* Actionable Pending Assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Assignments Needing Action</h2>
          <Link href="/student/assignments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            See All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loadingAssignments ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading assignments...
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground border rounded-2xl bg-card">
              🎉 All caught up! No pending assignments to complete right now.
            </div>
          ) : (
            pendingAssignments.slice(0, 4).map((a) => {
              const isPastDeadline = isDeadlinePast(a.deadline);
              return (
                <div key={a.id} className="p-6 rounded-2xl border bg-card shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
                        {a.subjectName}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        Max Marks: {a.maxMarks}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-1">{a.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className={`text-xs font-semibold ${isPastDeadline ? "text-rose-600" : "text-foreground"}`}>
                        {formatDateTime(a.deadline)}
                      </p>
                    </div>

                    <Link
                      href={`/student/assignments/${a.id}/submit`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <UploadCloud className="h-4 w-4" /> Submit Now
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
