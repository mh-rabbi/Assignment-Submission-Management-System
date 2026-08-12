/**
 * Auth helpers: reading/writing the stored AuthResponseDto,
 * and JWT utilities.
 *
 * Decision D-01: We store the full AuthResponseDto in localStorage so
 * we have `name` available for the sidebar without an Admin-only extra API call.
 */
import type { AuthResponseDto, Role } from "./types";

const STORAGE_KEY = "rc_auth";

export function getStoredAuth(): AuthResponseDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthResponseDto;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthResponseDto): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Decode the JWT payload without verifying signature.
 * We trust the server issued it — verification happens server-side on every request.
 * Used to extract role/classId if needed beyond what AuthResponseDto already provides.
 */
export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if the stored token is expired.
 * expiresAt is an ISO 8601 string from AuthResponseDto.
 */
export function isTokenExpired(auth: AuthResponseDto): boolean {
  return new Date(auth.expiresAt) <= new Date();
}

export function getRole(): Role | null {
  const auth = getStoredAuth();
  return auth?.role ?? null;
}
