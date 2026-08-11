"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api-client";
import type { TeacherAssignmentDto, CreateTeacherAssignmentDto } from "@/types/api";

export function useTeacherAssignments(teacherId?: string) {
  const queryClient = useQueryClient();

  const queryKey = teacherId
    ? ["teacher-assignments", "teacher", teacherId]
    : ["teacher-assignments"];

  const path = teacherId
    ? `/teacher-assignments/teacher/${teacherId}`
    : "/teacher-assignments";

  const query = useQuery<TeacherAssignmentDto[]>({
    queryKey,
    queryFn: () => clientFetch<TeacherAssignmentDto[]>(path),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateTeacherAssignmentDto) =>
      clientFetch<TeacherAssignmentDto>("/teacher-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Teacher assigned to subject/class successfully");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to assign teacher");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      clientFetch<void>(`/teacher-assignments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Teacher assignment removed");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove teacher assignment");
    },
  });

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    assignTeacher: createMutation.mutateAsync,
    isAssigning: createMutation.isPending,
    removeAssignment: deleteMutation.mutateAsync,
    isRemoving: deleteMutation.isPending,
  };
}
