"use client";

import { useState } from "react";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { useUsers } from "@/hooks/useUsers";
import { useSubjects } from "@/hooks/useSubjects";
import { useClasses } from "@/hooks/useClasses";
import { Plus, Trash2, UserCheck, Loader2 } from "lucide-react";

export default function TeacherAssignmentsPage() {
  const { assignments, isLoading, assignTeacher, removeAssignment, isAssigning } =
    useTeacherAssignments();
  const { users } = useUsers();
  const { subjects } = useSubjects();
  const { classes } = useClasses();

  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const teachers = users.filter((u) => u.role === "Teacher");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !subjectId || !classId) return;
    try {
      await assignTeacher({ teacherId, subjectId, classId });
      setIsOpen(false);
      setTeacherId("");
      setSubjectId("");
      setClassId("");
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Assign teachers to specific subjects and classes
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Mapping
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Teacher</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading mappings...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No teacher assignments mapped yet.
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{item.teacherName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.subjectName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.className}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm("Remove this teacher assignment?")) removeAssignment(item.id);
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-card rounded-xl p-6 border shadow-xl space-y-4">
            <h2 className="text-xl font-bold">Assign Teacher</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Teacher</label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                >
                  <option value="">Select Teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Subject</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Class</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                >
                  <option value="">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 text-sm rounded-md border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-medium"
                >
                  {isAssigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
