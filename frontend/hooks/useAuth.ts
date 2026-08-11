"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CurrentUser, LoginDto, RegisterDto, Role } from "@/types/api";

const ROLE_PATHS: Record<Role, string> = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
};

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query current user info from /api/auth/me
  const { data, isLoading, error } = useQuery<{ user: CurrentUser | null }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return { user: null };
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (dto: LoginDto) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Invalid credentials");
      }

      return res.json() as Promise<{ role: Role; name: string }>;
    },
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name || "user"}!`);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      const targetPath = ROLE_PATHS[data.role] || "/";
      router.push(targetPath);
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to log in");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (dto: RegisterDto) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Failed to register account");
      }

      return res.json() as Promise<{ role: Role; name: string }>;
    },
    onSuccess: (data) => {
      toast.success("Account created successfully!");
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      const targetPath = ROLE_PATHS[data.role] || "/";
      router.push(targetPath);
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Registration failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Logged out");
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  return {
    user: data?.user ?? null,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
