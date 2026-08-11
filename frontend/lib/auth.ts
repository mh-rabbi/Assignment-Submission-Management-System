// ============================================================
// lib/auth.ts — JWT decode helpers (server-only)
// Uses jose for JWT operations (Node.js + Edge compatible)
// ============================================================
import type { CurrentUser, Role } from "@/types/api";

/**
 * Decode a JWT token without verification.
 * We trust the token because the backend already validated it on every API call.
 * We only need the claims for display and route-guard logic.
 */
export function decodeToken(token: string): CurrentUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url decode the payload part
    const payload = parts[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    const claims = JSON.parse(decoded);

    // ASP.NET Core JWT uses long claim URIs by default, but we configured short names
    // Try both short names and full URIs
    const sub =
      claims["sub"] ||
      claims[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      "";
    const email =
      claims["email"] ||
      claims[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ] ||
      "";
    const role =
      claims["role"] ||
      claims[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] ||
      "";
    const classId = claims["classId"] || null;

    if (!sub || !role) return null;

    return {
      sub,
      email,
      name: "", // Name comes from user_info cookie, not JWT
      role: role as Role,
      classId,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired.
 * Returns true if expired or invalid.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = parts[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    const claims = JSON.parse(decoded);

    const exp = claims["exp"];
    if (!exp) return false; // No expiry = doesn't expire
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
