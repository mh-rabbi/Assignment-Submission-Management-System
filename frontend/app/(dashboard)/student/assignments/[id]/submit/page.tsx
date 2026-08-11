"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAssignment } from "@/hooks/useAssignments";
import { useSubmitAssignment, useMySubmissions } from "@/hooks/useSubmissions";
import { FileUpload } from "@/components/shared/FileUpload";
import { formatDateTime, isDeadlinePast } from "@/lib/utils";
import { ArrowLeft, AlertTriangle, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SubmitAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const { data: assignment, isLoading: loadingAssignment } = useAssignment(assignmentId);
  const { data: mySubmissions } = useMySubmissions();
  const { mutateAsync: submitAssignment, isPending: isSubmitting } = useSubmitAssignment();

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const existingSubmission = mySubmissions?.find((s) => s.assignmentId === assignmentId);

  useEffect(() => {
    if (existingSubmission) {
      setContent(existingSubmission.content || "");
    }
  }, [existingSubmission]);

  const isPast = assignment ? isDeadlinePast(assignment.deadline) : false;
  const isLateBlocked = isPast && !assignment?.allowLateSubmission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !file) {
      alert("Please provide text content or attach a file.");
      return;
    }

    try {
      await submitAssignment({
        dto: {
          assignmentId,
          content,
        },
        file,
      });
      router.push("/student/submissions");
    } catch {}
  };

  if (loadingAssignment) {
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
          href="/student/assignments"
          className="p-2 rounded-lg border bg-card hover:bg-accent text-muted-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit Assignment</h1>
          <p className="text-sm text-muted-foreground">
            {assignment.subjectName} — {assignment.title}
          </p>
        </div>
      </div>

      {/* Assignment Overview Box */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Teacher: <strong className="text-foreground">{assignment.teacherName}</strong></span>
          <span>Max Marks: <strong className="text-foreground">{assignment.maxMarks}</strong></span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{assignment.description}</p>
        <div className="pt-2 text-xs font-semibold">
          Deadline: <span className={isPast ? "text-rose-600 font-bold" : "text-primary"}>{formatDateTime(assignment.deadline)}</span>
        </div>
      </div>

      {/* Late Submission Warnings */}
      {isLateBlocked && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-300 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            The deadline for this assignment has passed and late submissions are disabled by your teacher.
          </p>
        </div>
      )}

      {isPast && !isLateBlocked && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Note: The deadline has passed. Your submission will be flagged as <strong>LATE</strong>.
          </p>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="p-8 rounded-2xl border bg-card shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Written Response / Notes</label>
          <textarea
            rows={6}
            placeholder="Type your response, answer code, or submission notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Attach File (Optional)</label>
          <FileUpload file={file} onFileSelect={setFile} />
          {existingSubmission?.filePath && !file && (
            <p className="text-xs text-muted-foreground mt-1">
              Existing file attached: <span className="font-semibold text-foreground">View in My Submissions</span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            href="/student/assignments"
            className="px-5 py-2 text-sm font-medium rounded-lg border hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isLateBlocked}
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                {existingSubmission ? "Resubmit Work" : "Submit Assignment"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
