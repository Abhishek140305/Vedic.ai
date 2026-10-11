import { NextRequest, NextResponse } from "next/server";

// This is server-only: use service DNS in Docker and localhost for host development.
const BACKEND_URL = (
  process.env.BACKEND_INTERNAL_URL ??
  process.env.BACKEND_URL ??
  "http://127.0.0.1:8001"
).replace(/\/$/, "");

async function forward(request: NextRequest, path: string[]) {
  const url = `${BACKEND_URL}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
    signal: AbortSignal.timeout(50_000),
  };

  let response: Response;
  let body: ArrayBuffer;
  try {
    response = await fetch(url, init);
    body = await response.arrayBuffer();
  } catch (error) {
    console.error(`Backend proxy connection failed for ${url}`, error);
    return NextResponse.json(
      {
        detail: error instanceof DOMException && error.name === "TimeoutError"
          ? "The backend took too long to respond. Please try again."
          : "The Ayurveda assistant is temporarily unavailable. Please try again shortly.",
      },
      { status: error instanceof DOMException && error.name === "TimeoutError" ? 504 : 502 }
    );
  }

  return new NextResponse(body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path);
}
