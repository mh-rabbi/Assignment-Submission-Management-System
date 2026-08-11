"use client";

import { useState } from "react";
import Link from "next/link";
import { useAssignments } from "@/hooks/useAssignments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { AssignmentStatus } from "@/types/api";
import { PlusCircle, Edit3, Trash2, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function TeacherAssignmentsPage() {
  const { assignments, isLoading, patchStatus, deleteAssignment, isPatching, isDeleting } =
    useAssignments();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      a.className.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: AssignmentStatus) => {
    try {
      await patchStatus({ id, dto: { status: newStatus } });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Manage assignment lifecycles, deadlines, and publishing status
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <PlusCircle className="h-4 w-4" /> Create Assignment
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assignments by title, subject, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="ALL">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Assignments Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Deadline</th>
                <th className="px-6 py-3.5">Max Marks</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading assignments...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No assignments found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{a.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.subjectName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.className}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDateTime(a.deadline)}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{a.maxMarks}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* Status toggle actions */}
                      {a.status === "Draft" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "Published")}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      {a.status === "Published" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "Closed")}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 transition-colors"
                        >
                          Close
                        </button>
                      )}
                      <Link
                        href={`/teacher/assignments/${a.id}/edit`}
                        className="inline-flex p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Delete assignment "${a.title}"?`)) deleteAssignment(a.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
