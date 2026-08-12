/**
 * Typed API client for the Roll Call backend.
 *
 * All API calls go through apiFetch(), which:
 * - Prepends /api/ (proxied by Next.js to http://localhost:8080)
 * - Attaches the Authorization: Bearer <token> header
 * - Parses errors into a consistent ApiError shape
 * - Accepts any 2xx as success (important: POST /api/teacher-assignments and
 *   POST /api/submissions return 200, not 201 — see decisions.md D-03, D-04)
 */
import { getStoredAuth, clearStoredAuth } from "./auth";
import type {
  ApiError,
  AuthResponseDto,
  LoginRequest,
  RegisterRequest,
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  ClassDto,
  CreateClassRequest,
  UpdateClassRequest,
  SubjectDto,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  TeacherAssignmentDto,
  CreateTeacherAssignmentRequest,
  AssignmentDto,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  UpdateAssignmentStatusRequest,
  SubmissionDto,
  GradeSubmissionRequest,
  UpdateSubmissionStatusRequest,
  SubmissionHistoryDto,
} from "./types";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public apiError: ApiError
  ) {
    super(apiError.message);
    this.name = "ApiException";
  }
}

/**
 * 401 on any protected call means the token is bad/expired.
 * Automatically clears auth and dispatches a custom event so AuthContext
 * can react and redirect to /auth.
 */
function handle401(): never {
  clearStoredAuth();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rc:unauthorized"));
  }
  throw new ApiException(401, {
    statusCode: 401,
    message: "Session expired. Please sign in again.",
    errors: null,
  });
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = getStoredAuth();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (auth?.token) {
    headers["Authorization"] = `Bearer ${auth.token}`;
  }

  // Don't set Content-Type for FormData — browser sets it with the boundary
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    handle401();
  }

  if (!res.ok) {
    let apiError: ApiError;
    try {
      apiError = await res.json();
    } catch {
      apiError = {
        statusCode: res.status,
        message: res.statusText || "An unexpected error occurred.",
        errors: null,
      };
    }
    throw new ApiException(res.status, apiError);
  }

  // 204 No Content has no body
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponseDto>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponseDto>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => apiFetch<UserDto[]>("/api/users"),
  get: (id: string) => apiFetch<UserDto>(`/api/users/${id}`),
  create: (body: CreateUserRequest) =>
    apiFetch<UserDto>("/api/users", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: UpdateUserRequest) =>
    apiFetch<UserDto>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/users/${id}`, { method: "DELETE" }),
};

// ─── Classes ──────────────────────────────────────────────────────────────────

export const classesApi = {
  list: () => apiFetch<ClassDto[]>("/api/classes"),
  get: (id: string) => apiFetch<ClassDto>(`/api/classes/${id}`),
  create: (body: CreateClassRequest) =>
    apiFetch<ClassDto>("/api/classes", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: UpdateClassRequest) =>
    apiFetch<ClassDto>(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/classes/${id}`, { method: "DELETE" }),
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjectsApi = {
  list: () => apiFetch<SubjectDto[]>("/api/subjects"),
  get: (id: string) => apiFetch<SubjectDto>(`/api/subjects/${id}`),
  create: (body: CreateSubjectRequest) =>
    apiFetch<SubjectDto>("/api/subjects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: UpdateSubjectRequest) =>
    apiFetch<SubjectDto>(`/api/subjects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/subjects/${id}`, { method: "DELETE" }),
};

// ─── Teacher Assignments ──────────────────────────────────────────────────────

export const teacherAssignmentsApi = {
  // NOTE: Returns 200, not 201 (decisions.md D-03)
  list: () => apiFetch<TeacherAssignmentDto[]>("/api/teacher-assignments"),
  listByTeacher: (teacherId: string) =>
    apiFetch<TeacherAssignmentDto[]>(`/api/teacher-assignments/teacher/${teacherId}`),
  create: (body: CreateTeacherAssignmentRequest) =>
    apiFetch<TeacherAssignmentDto>("/api/teacher-assignments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/teacher-assignments/${id}`, { method: "DELETE" }),
};

// ─── Assignments ──────────────────────────────────────────────────────────────

export const assignmentsApi = {
  list: () => apiFetch<AssignmentDto[]>("/api/assignments"),
  get: (id: string) => apiFetch<AssignmentDto>(`/api/assignments/${id}`),
  create: (body: CreateAssignmentRequest) =>
    apiFetch<AssignmentDto>("/api/assignments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: UpdateAssignmentRequest) =>
    apiFetch<AssignmentDto>(`/api/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  updateStatus: (id: string, body: UpdateAssignmentStatusRequest) =>
    apiFetch<AssignmentDto>(`/api/assignments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/assignments/${id}`, { method: "DELETE" }),
  getSubmissions: (assignmentId: string) =>
    apiFetch<SubmissionDto[]>(`/api/assignments/${assignmentId}/submissions`),
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submissionsApi = {
  list: () => apiFetch<SubmissionDto[]>("/api/submissions"),
  mine: () => apiFetch<SubmissionDto[]>("/api/submissions/mine"),
  get: (id: string) => apiFetch<SubmissionDto>(`/api/submissions/${id}`),
  // NOTE: Returns 200, not 201 — acts as upsert (decisions.md D-04)
  // Content-Type is NOT set; browser sets multipart boundary automatically
  submit: (formData: FormData) =>
    apiFetch<SubmissionDto>("/api/submissions", { method: "POST", body: formData }),
  grade: (id: string, body: GradeSubmissionRequest) =>
    apiFetch<SubmissionDto>(`/api/submissions/${id}/grade`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  updateStatus: (id: string, body: UpdateSubmissionStatusRequest) =>
    apiFetch<SubmissionDto>(`/api/submissions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getHistory: (id: string) =>
    apiFetch<SubmissionHistoryDto[]>(`/api/submissions/${id}/history`),
  /**
   * Download a submission file.
   * Cannot use a plain <a href> tag because the endpoint requires Authorization header.
   * See decisions.md D-10.
   */
  downloadFile: async (submissionId: string, filename = "submission-file"): Promise<void> => {
    const auth = getStoredAuth();
    const res = await fetch(`/api/submissions/${submissionId}/file`, {
      headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
    });
    if (!res.ok) throw new Error("File not found or access denied.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Try to get filename from Content-Disposition header
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    a.download = match?.[1]?.replace(/['"]/g, "") ?? filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
