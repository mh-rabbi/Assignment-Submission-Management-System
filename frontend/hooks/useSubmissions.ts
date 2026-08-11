"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api-client";
import type {
  SubmissionDto,
  SubmissionHistoryDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  PatchSubmissionStatusDto,
} from "@/types/api";

export function useSubmissions() {
  return useQuery<SubmissionDto[]>({
    queryKey: ["submissions"],
    queryFn: () => clientFetch<SubmissionDto[]>("/submissions"),
  });
}

export function useMySubmissions() {
  return useQuery<SubmissionDto[]>({
    queryKey: ["submissions", "mine"],
    queryFn: () => clientFetch<SubmissionDto[]>("/submissions/mine"),
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery<SubmissionDto[]>({
    queryKey: ["submissions", "assignment", assignmentId],
    queryFn: () => clientFetch<SubmissionDto[]>(`/assignments/${assignmentId}/submissions`),
    enabled: !!assignmentId,
  });
}

export function useSubmission(id: string) {
  return useQuery<SubmissionDto>({
    queryKey: ["submissions", id],
    queryFn: () => clientFetch<SubmissionDto>(`/submissions/${id}`),
    enabled: !!id,
  });
}

export function useSubmissionHistory(id: string) {
  return useQuery<SubmissionHistoryDto[]>({
    queryKey: ["submissions", id, "history"],
    queryFn: () => clientFetch<SubmissionHistoryDto[]>(`/submissions/${id}/history`),
    enabled: !!id,
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dto,
      file,
    }: {
      dto: SubmitAssignmentDto;
      file: File | null;
    }) => {
      const formData = new FormData();
      formData.append("assignmentId", dto.assignmentId);
      formData.append("content", dto.content);
      if (file) {
        formData.append("file", file);
      }

      // Hit /api/backend/submissions via clientFetch (or direct proxy fetch with FormData)
      const res = await fetch("/api/backend/submissions", {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type header — browser auto-sets boundary
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Submission failed" }));
        throw new Error(errData.message || "Failed to submit assignment");
      }

      return res.json() as Promise<SubmissionDto>;
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit assignment");
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: GradeSubmissionDto }) =>
      clientFetch<SubmissionDto>(`/submissions/${id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: (data) => {
      toast.success(`Submission graded: ${data.marks} marks`);
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to grade submission");
    },
  });
}

export function usePatchSubmissionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PatchSubmissionStatusDto }) =>
      clientFetch<SubmissionDto>(`/submissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }),
    onSuccess: (_, variables) => {
      toast.success(`Submission status changed to ${variables.dto.status}`);
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update submission status");
    },
  });
}
