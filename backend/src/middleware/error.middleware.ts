import { NextResponse } from "next/server";
import { connectDB } from "../lib/mongoose";
import AuditLog from "@/models/AuditLog";

interface RouteError extends Error {
  error_code?: string;
  statusCode?: number;
}

export function withErrorHandler(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      const err = error as RouteError;
      const statusCode = err.statusCode ?? 500;
      const errorCode = err.error_code ?? "INTERNAL_ERROR";
      const message =
        statusCode < 500
          ? err.message
          : process.env.NODE_ENV === "production"
          ? "An unexpected error occurred. Please try again."
          : err.message;

      logError(err, request).catch(console.error);

      return NextResponse.json(
        {
          success: false,
          data: null,
          error: message,
          error_code: errorCode,
        },
        { status: statusCode }
      );
    }
  };
}

async function logError(err: RouteError, request: Request): Promise<void> {
  try {
    await connectDB();
    const url = new URL(request.url);
    await AuditLog.create({
      action: "API_ERROR",
      entityType: "Request",
      entityId: url.pathname,
      metadata: {
        method: request.method,
        path: url.pathname,
        error: err.message,
        error_code: err.error_code,
        stack:
          process.env.NODE_ENV !== "production" ? err.stack : undefined,
      },
      ipAddress:
        (request.headers as Headers).get("x-forwarded-for")?.split(",")[0] ??
        undefined,
    });
  } catch {
    // DB logging failure must not crash the app
  }
}
