// ============================================================
// lib/api-client.ts — Pure client-side fetch wrapper
// Safe to import in Client Components ("use client")
// ============================================================
import type { ApiErrorResponse } from "@/types/api";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors: string[] | null = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Client-side fetch: sends requests via /api/backend rewrite proxy
 * Browser automatically includes cookies (auth_token & user_info).
 */
export async function clientFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    let errBody: ApiErrorResponse;
    try {
      errBody = await res.json();
    } catch {
      errBody = {
        statusCode: res.status,
        message: res.statusText,
        errors: null,
      };
    }
    throw new ApiError(
      errBody.statusCode ?? res.status,
      errBody.message ?? "Request failed",
      errBody.errors ?? null
    );
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
