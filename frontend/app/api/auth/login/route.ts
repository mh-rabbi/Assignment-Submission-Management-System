// app/api/auth/login/route.ts — Route Handler for login
// Sets httpOnly auth_token cookie + readable user_info cookie
import { NextRequest, NextResponse } from "next/server";
import { backendLogin } from "@/lib/server-api-client";
import type { LoginDto } from "@/types/api";

export async function POST(request: NextRequest) {
  let dto: LoginDto;
  try {
    dto = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  try {
    const authResponse = await backendLogin(dto);

    const expiresAt = new Date(authResponse.expiresAt);
    const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    const response = NextResponse.json({
      role: authResponse.role,
      name: authResponse.name,
    });

    // httpOnly cookie for the JWT — not accessible from JS
    response.cookies.set("auth_token", authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Readable cookie for user display info (name, role, etc.)
    // NOT httpOnly so client React can read it for display purposes
    response.cookies.set(
      "user_info",
      JSON.stringify({
        sub: authResponse.userId,
        name: authResponse.name,
        email: authResponse.email,
        role: authResponse.role,
        classId: authResponse.classId,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      }
    );

    return response;
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const e = error as { statusCode: number; message: string; errors: string[] | null };
      return NextResponse.json(
        { statusCode: e.statusCode, message: e.message, errors: e.errors },
        { status: e.statusCode }
      );
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
