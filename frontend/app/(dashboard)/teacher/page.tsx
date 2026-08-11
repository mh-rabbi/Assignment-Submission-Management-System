"use client";

import Link from "next/link";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { FileText, PlusCircle, CheckSquare, Clock, ArrowRight, Loader2 } from "lucide-react";

export default function TeacherDashboardPage() {
  const { assignments, isLoading: loadingAssignments } = useAssignments();
  const { data: submissions, isLoading: loadingSubmissions } = useSubmissions();

  const publishedCount = assignments.filter((a) => a.status === "Published").length;
  const draftCount = assignments.filter((a) => a.status === "Draft").length;
  const pendingGradingCount = submissions?.filter((s) => s.status === "Submitted").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your assignments, publish coursework, and grade student submissions
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:scale-105"
        >
          <PlusCircle className="h-4 w-4" /> Create Assignment
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">My Assignments</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground">{assignments.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {publishedCount} Published, {draftCount} Drafts
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Pending Submissions</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground">{pendingGradingCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Awaiting evaluation & marks</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Total Submissions</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground">{submissions?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Across all published assignments</div>
          </div>
        </div>
      </div>

      {/* Recent Assignments Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Assignments</h2>
          <Link href="/teacher/assignments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Deadline</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingAssignments ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      You have not created any assignments yet.
                    </td>
                  </tr>
                ) : (
                  assignments.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{a.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">{a.subjectName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{a.className}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDateTime(a.deadline)}</td>
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
    </div>
  );
}
