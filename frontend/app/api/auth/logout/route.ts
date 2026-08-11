// app/api/auth/logout/route.ts — Route Handler for logout
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.delete("auth_token");
  response.cookies.delete("user_info");
  return response;
}
