"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api-client";
import type { UserDto, CreateUserDto, UpdateUserDto } from "@/types/api";

export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery<UserDto[]>({
    queryKey: ["users"],
    queryFn: () => clientFetch<UserDto[]>("/users"),
  });

  const createUserMutation = useMutation({
    mutationFn: (dto: CreateUserDto) =>
      clientFetch<UserDto>("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      clientFetch<UserDto>(`/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) =>
      clientFetch<void>(`/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete user");
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
  };
}
