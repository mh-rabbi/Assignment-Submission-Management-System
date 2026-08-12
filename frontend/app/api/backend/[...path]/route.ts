// app/api/backend/[...path]/route.ts
// Catch-all API Route Handler to proxy requests to the backend server.
// Reads the httpOnly "auth_token" cookie and automatically attaches:
// "Authorization: Bearer <token>"
// to all outgoing backend calls.

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

async function proxyRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>
) {
  const { path } = await paramsPromise;
  const pathString = path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/${pathString}${search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers = new Headers();

  // Copy relevant request headers from client
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }

  // Attach Bearer token from httpOnly cookie if present
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const method = request.method;
  let body: ArrayBuffer | undefined = undefined;

  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      body = await request.arrayBuffer();
    } catch {}
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });

    const resContentType = backendRes.headers.get("content-type") || "";
    const resHeaders = new Headers();
    if (resContentType) {
      resHeaders.set("content-type", resContentType);
    }

    const resData = await backendRes.arrayBuffer();
    return new Response(resData, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { statusCode: 502, message: "Backend service unreachable", errors: null },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}
