import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * Validate a Next.js request body against a Zod schema.
 * Returns { data, errorResponse } — if errorResponse is non-null,
 * return it immediately from the route handler.
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; errorResponse: null } | { data: null; errorResponse: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        data: null,
        errorResponse: NextResponse.json(
          {
            success: false,
            data: null,
            error: "Validation failed",
            error_code: "VALIDATION_ERROR",
            fields: formatZodErrors(result.error),
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data, errorResponse: null };
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          data: null,
          error: "Invalid JSON body",
          error_code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate URL search params against a Zod schema.
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T; errorResponse: null } | { data: null; errorResponse: NextResponse } {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          data: null,
          error: "Invalid query parameters",
          error_code: "VALIDATION_ERROR",
          fields: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, errorResponse: null };
}

/**
 * Format Zod errors into a flat { field: message } map for frontend use.
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (path) fields[path] = issue.message;
  }
  return fields;
}
