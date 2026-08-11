"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssignments } from "@/hooks/useAssignments";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { createAssignment, isCreating } = useAssignments();
  const { assignments: teacherMappings, isLoading: loadingMappings } = useTeacherAssignments();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !selectedMappingId || !deadline) return;

    const mapping = teacherMappings.find((m) => m.id === selectedMappingId);
    if (!mapping) return;

    try {
      await createAssignment({
        title,
        description,
        subjectId: mapping.subjectId,
        classId: mapping.classId,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        allowLateSubmission,
      });
      router.push("/teacher/assignments");
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/assignments"
          className="p-2 rounded-lg border bg-card hover:bg-accent text-muted-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Assignment</h1>
          <p className="text-sm text-muted-foreground">Draft a new coursework assignment for your class</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-2xl border bg-card shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Midterm Project — Algebra & Functions"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Subject & Class</label>
          {loadingMappings ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your assigned subjects...
            </div>
          ) : teacherMappings.length === 0 ? (
            <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900">
              No teacher assignments mapped to your account yet. Contact an Admin to assign subjects/classes.
            </div>
          ) : (
            <select
              required
              value={selectedMappingId}
              onChange={(e) => setSelectedMappingId(e.target.value)}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select Subject and Class...</option>
              {teacherMappings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.subjectName} — {m.className}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Description & Instructions</label>
          <textarea
            required
            rows={5}
            placeholder="Provide clear guidelines, problem numbers, or submission instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Deadline</label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Max Marks</label>
            <input
              type="number"
              required
              min={1}
              max={1000}
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="allowLate"
            checked={allowLateSubmission}
            onChange={(e) => setAllowLateSubmission(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="allowLate" className="text-sm font-medium cursor-pointer">
            Allow late submissions after deadline
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            href="/teacher/assignments"
            className="px-5 py-2 text-sm font-medium rounded-lg border hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isCreating || teacherMappings.length === 0}
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
          >
            {isCreating ? "Creating Draft..." : "Create Draft Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
