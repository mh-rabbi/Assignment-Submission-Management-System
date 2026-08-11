"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api-client";
import type { SubjectDto, CreateSubjectDto, UpdateSubjectDto } from "@/types/api";

export function useSubjects() {
  const queryClient = useQueryClient();

  const subjectsQuery = useQuery<SubjectDto[]>({
    queryKey: ["subjects"],
    queryFn: () => clientFetch<SubjectDto[]>("/subjects"),
  });

  const createSubjectMutation = useMutation({
    mutationFn: (dto: CreateSubjectDto) =>
      clientFetch<SubjectDto>("/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Subject created successfully");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create subject");
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubjectDto }) =>
      clientFetch<SubjectDto>(`/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Subject updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update subject");
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) =>
      clientFetch<void>(`/subjects/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Subject deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete subject");
    },
  });

  return {
    subjects: subjectsQuery.data ?? [],
    isLoading: subjectsQuery.isLoading,
    error: subjectsQuery.error,
    refetch: subjectsQuery.refetch,
    createSubject: createSubjectMutation.mutateAsync,
    isCreating: createSubjectMutation.isPending,
    updateSubject: updateSubjectMutation.mutateAsync,
    isUpdating: updateSubjectMutation.isPending,
    deleteSubject: deleteSubjectMutation.mutateAsync,
    isDeleting: deleteSubjectMutation.isPending,
  };
}
