/**
 * TypeScript types mirroring all backend DTOs from backend_api.md.
 * Ground truth: do not invent fields not documented in the API reference.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = "Admin" | "Teacher" | "Student";

export interface AuthResponseDto {
  token: string;
  email: string;
  name: string;
  role: Role;
  userId: string;
  classId: string | null;
  expiresAt: string; // ISO 8601
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  classId?: string | null;
}

// ─── Standard Error Shape ────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  errors: string[] | null;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  classId: string | null;
  className: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  classId?: string | null;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  classId?: string | null;
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export interface ClassDto {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateClassRequest {
  name: string;
}

export interface UpdateClassRequest {
  name: string;
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export interface SubjectDto {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSubjectRequest {
  name: string;
}

export interface UpdateSubjectRequest {
  name: string;
}

// ─── Teacher Assignments ──────────────────────────────────────────────────────

export interface TeacherAssignmentDto {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  createdAt: string;
}

export interface CreateTeacherAssignmentRequest {
  teacherId: string;
  subjectId: string;
  classId: string;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export type AssignmentStatus = "Draft" | "Published" | "Closed";

export interface AssignmentDto {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  deadline: string; // ISO 8601
  maxMarks: number;
  status: AssignmentStatus;
  allowLateSubmission: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId?: string | null; // Required if Admin, ignored if Teacher
  deadline: string; // ISO 8601
  maxMarks: number;
  allowLateSubmission: boolean;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  maxMarks?: number;
  deadline?: string;
  allowLateSubmission?: boolean;
}

export interface UpdateAssignmentStatusRequest {
  status: AssignmentStatus;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export type SubmissionStatus = "Submitted" | "Graded";

export interface SubmissionDto {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  content: string;
  filePath: string | null; // Relative download URL: /api/submissions/{id}/file, or null
  submittedAt: string;
  isLate: boolean;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradeSubmissionRequest {
  marks: number;
  feedback?: string;
}

export interface UpdateSubmissionStatusRequest {
  status: SubmissionStatus;
}

export interface SubmissionHistoryDto {
  id: string;
  content: string;
  filePath: string | null;
  editedAt: string;
}

// ─── UI-derived types (not from API) ─────────────────────────────────────────

/**
 * Student-facing derived submission status.
 * Computed client-side by cross-referencing GET /api/assignments with GET /api/submissions/mine.
 * See: decisions.md D-05
 */
export type StudentSubmissionDisplayStatus =
  | "not-submitted"
  | "submitted"
  | "late"
  | "graded";
