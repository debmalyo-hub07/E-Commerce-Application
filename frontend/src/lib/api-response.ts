import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  error_code?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Return a successful JSON response.
 */
export function successResponse<T>(
  data: T,
  status = 200,
  meta?: ApiResponse["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, error: null, ...(meta ? { meta } : {}) },
    { status }
  );
}

/**
 * Return an error JSON response.
 */
export function errorResponse(
  error: string,
  error_code: string = "INTERNAL_ERROR",
  status = 500
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, data: null, error, error_code },
    { status }
  );
}

/**
 * Return a 401 Unauthorized response.
 */
export function unauthorizedResponse(
  message = "Authentication required"
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, "UNAUTHORIZED", 401);
}

/**
 * Return a 403 Forbidden response.
 */
export function forbiddenResponse(
  message = "You do not have permission to perform this action"
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, "FORBIDDEN", 403);
}

/**
 * Return a 404 Not Found response.
 */
export function notFoundResponse(
  entity = "Resource"
): NextResponse<ApiResponse<null>> {
  return errorResponse(`${entity} not found`, "NOT_FOUND", 404);
}

/**
 * Return a 400 Validation Error response with field-level errors.
 */
export function validationErrorResponse(
  fields: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: "Validation failed",
      error_code: "VALIDATION_ERROR",
      fields,
    },
    { status: 400 }
  );
}

/**
 * Build pagination meta from query params and total count.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): NonNullable<ApiResponse["meta"]> {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / Math.max(1, limit)),
  };
}