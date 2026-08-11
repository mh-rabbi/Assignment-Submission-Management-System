"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api-client";
import type {
  AssignmentDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  PatchAssignmentStatusDto,
} from "@/types/api";

export function useAssignments() {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery<AssignmentDto[]>({
    queryKey: ["assignments"],
    queryFn: () => clientFetch<AssignmentDto[]>("/assignments"),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (dto: CreateAssignmentDto) =>
      clientFetch<AssignmentDto>("/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Assignment created successfully");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create assignment");
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAssignmentDto }) =>
      clientFetch<AssignmentDto>(`/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Assignment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update assignment");
    },
  });

  const patchStatusMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PatchAssignmentStatusDto }) =>
      clientFetch<AssignmentDto>(`/assignments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: (_, variables) => {
      toast.success(`Assignment status changed to ${variables.dto.status}`);
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) =>
      clientFetch<void>(`/assignments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Assignment deleted");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete assignment");
    },
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
    error: assignmentsQuery.error,
    refetch: assignmentsQuery.refetch,
    createAssignment: createAssignmentMutation.mutateAsync,
    isCreating: createAssignmentMutation.isPending,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    isUpdating: updateAssignmentMutation.isPending,
    patchStatus: patchStatusMutation.mutateAsync,
    isPatching: patchStatusMutation.isPending,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
    isDeleting: deleteAssignmentMutation.isPending,
  };
}

export function useAssignment(id: string) {
  return useQuery<AssignmentDto>({
    queryKey: ["assignments", id],
    queryFn: () => clientFetch<AssignmentDto>(`/assignments/${id}`),
    enabled: !!id,
  });
}
