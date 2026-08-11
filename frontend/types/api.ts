// ============================================================
// types/api.ts — TypeScript interfaces mirroring backend DTOs exactly
// All field names match camelCase JSON output from ASP.NET Core
// ============================================================

// ------- Enums -------
export type Role = "Admin" | "Teacher" | "Student";
export type AssignmentStatus = "Draft" | "Published" | "Closed";
export type SubmissionStatus = "Submitted" | "Graded";

// ------- Auth -------
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  classId?: string | null;
}

/** Returned by POST /api/auth/login and POST /api/auth/register */
export interface AuthResponseDto {
  token: string;
  email: string;
  name: string;
  role: Role;
  userId: string;
  classId: string | null;
  expiresAt: string; // ISO date string
}

// ------- Users -------
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

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  classId?: string | null;
}

export interface UpdateUserDto {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  classId?: string | null;
}

// ------- Classes -------
export interface ClassDto {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateClassDto {
  name: string;
}

export interface UpdateClassDto {
  name?: string | null;
}

// ------- Subjects -------
export interface SubjectDto {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSubjectDto {
  name: string;
}

export interface UpdateSubjectDto {
  name?: string | null;
}

// ------- TeacherSubjectClass (Teacher Assignments) -------
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

export interface CreateTeacherAssignmentDto {
  teacherId: string;
  subjectId: string;
  classId: string;
}

// ------- Assignments -------
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
  deadline: string; // ISO date string (DateTimeOffset)
  maxMarks: number;
  status: AssignmentStatus;
  allowLateSubmission: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentDto {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  /** Required when caller is Admin; ignored when caller is Teacher */
  teacherId?: string | null;
  deadline: string; // ISO date string
  maxMarks: number;
  allowLateSubmission: boolean;
}

export interface UpdateAssignmentDto {
  title?: string | null;
  description?: string | null;
  deadline?: string | null;
  maxMarks?: number | null;
  allowLateSubmission?: boolean | null;
}

export interface PatchAssignmentStatusDto {
  status: AssignmentStatus;
}

// ------- Submissions -------
/** POST /api/submissions — multipart/form-data */
export interface SubmitAssignmentDto {
  assignmentId: string;
  content: string;
  // file is sent separately as FormData
}

export interface GradeSubmissionDto {
  marks: number;
  feedback?: string | null;
}

export interface PatchSubmissionStatusDto {
  status: SubmissionStatus;
}

export interface SubmissionDto {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  content: string;
  /**
   * When a file was uploaded: contains relative URL "/api/submissions/{id}/file"
   * When no file: null
   * NOTE: field is named "filePath" in the DTO but contains a relative URL
   */
  filePath: string | null;
  submittedAt: string;
  isLate: boolean;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionHistoryDto {
  id: string;
  content: string;
  /**
   * When a file was in the snapshot: contains relative URL "/api/submissions/{id}/file"
   * When no file: null
   */
  filePath: string | null;
  editedAt: string;
}

// ------- Error Response -------
/** Consistent error shape from ExceptionMiddleware */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors: string[] | null; // null when no field errors, NOT empty array
}

// ------- Current User (decoded from cookie/response, not from API) -------
export interface CurrentUser {
  sub: string; // userId
  email: string;
  name: string;
  role: Role;
  classId: string | null;
}
