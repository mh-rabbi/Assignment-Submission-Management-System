"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api-client";
import type { ClassDto, CreateClassDto, UpdateClassDto } from "@/types/api";

export function useClasses() {
  const queryClient = useQueryClient();

  const classesQuery = useQuery<ClassDto[]>({
    queryKey: ["classes"],
    queryFn: () => clientFetch<ClassDto[]>("/classes"),
  });

  const createClassMutation = useMutation({
    mutationFn: (dto: CreateClassDto) =>
      clientFetch<ClassDto>("/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Class created successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create class");
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClassDto }) =>
      clientFetch<ClassDto>(`/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("Class updated successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update class");
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) =>
      clientFetch<void>(`/classes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Class deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete class");
    },
  });

  return {
    classes: classesQuery.data ?? [],
    isLoading: classesQuery.isLoading,
    error: classesQuery.error,
    refetch: classesQuery.refetch,
    createClass: createClassMutation.mutateAsync,
    isCreating: createClassMutation.isPending,
    updateClass: updateClassMutation.mutateAsync,
    isUpdating: updateClassMutation.isPending,
    deleteClass: deleteClassMutation.mutateAsync,
    isDeleting: deleteClassMutation.isPending,
  };
}
