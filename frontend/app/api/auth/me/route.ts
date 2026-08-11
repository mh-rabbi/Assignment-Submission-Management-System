// app/api/auth/me/route.ts — Route Handler for getting current user info
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userInfoCookie = cookieStore.get("user_info")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let name = decoded.name;
  if (userInfoCookie) {
    try {
      const parsed = JSON.parse(userInfoCookie);
      if (parsed.name) name = parsed.name;
    } catch {}
  }

  return NextResponse.json({
    user: {
      ...decoded,
      name,
    },
  });
}
