// ============================================================
// lib/server-api-client.ts — Server-only typed fetch wrapper
// For Server Components and Route Handlers that read cookies() directly
// ============================================================
import { cookies } from "next/headers";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  ClassDto,
  CreateClassDto,
  UpdateClassDto,
  SubjectDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  TeacherAssignmentDto,
  CreateTeacherAssignmentDto,
  AssignmentDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  PatchAssignmentStatusDto,
  SubmissionDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  PatchSubmissionStatusDto,
  SubmissionHistoryDto,
  ApiErrorResponse,
} from "@/types/api";

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

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function serverFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
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

export async function backendLogin(dto: LoginDto): Promise<AuthResponseDto> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    let errBody: ApiErrorResponse;
    try {
      errBody = await res.json();
    } catch {
      errBody = { statusCode: res.status, message: res.statusText, errors: null };
    }
    throw new ApiError(errBody.statusCode ?? res.status, errBody.message, errBody.errors ?? null);
  }
  return res.json();
}

export async function backendRegister(dto: RegisterDto): Promise<AuthResponseDto> {
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    let errBody: ApiErrorResponse;
    try {
      errBody = await res.json();
    } catch {
      errBody = { statusCode: res.status, message: res.statusText, errors: null };
    }
    throw new ApiError(errBody.statusCode ?? res.status, errBody.message, errBody.errors ?? null);
  }
  return res.json();
}

export const getUsers = () => serverFetch<UserDto[]>("/api/users");
export const getClasses = () => serverFetch<ClassDto[]>("/api/classes");
export const getSubjects = () => serverFetch<SubjectDto[]>("/api/subjects");
export const getAssignments = () => serverFetch<AssignmentDto[]>("/api/assignments");
