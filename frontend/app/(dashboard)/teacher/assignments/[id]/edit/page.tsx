"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAssignment, useAssignments } from "@/hooks/useAssignments";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: assignment, isLoading } = useAssignment(id);
  const { updateAssignment, isUpdating } = useAssignments();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      // Format deadline for datetime-local input
      if (assignment.deadline) {
        const d = new Date(assignment.deadline);
        const iso = d.toISOString().slice(0, 16);
        setDeadline(iso);
      }
      setMaxMarks(assignment.maxMarks);
      setAllowLateSubmission(assignment.allowLateSubmission);
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) return;

    try {
      await updateAssignment({
        id,
        dto: {
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          maxMarks: Number(maxMarks),
          allowLateSubmission,
        },
      });
      router.push("/teacher/assignments");
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading assignment details...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Assignment not found.
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Edit Assignment</h1>
          <p className="text-sm text-muted-foreground">
            {assignment.subjectName} — {assignment.className}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-2xl border bg-card shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Description & Instructions</label>
          <textarea
            required
            rows={5}
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
            disabled={isUpdating}
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
