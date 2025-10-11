import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

// Standard error response format
export interface ValidationErrorResponse {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = ValidationErrorResponse | SuccessResponse<T>;

/**
 * Validates request body against a Zod schema and returns formatted error response
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<
  { success: true; data: T } | { success: false; response: NextResponse<ValidationErrorResponse> }
> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};

      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      });

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            fieldErrors,
          } as ValidationErrorResponse,
          { status: 400 }
        ),
      };
    }

    // Handle JSON parsing errors
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON format',
        } as ValidationErrorResponse,
        { status: 400 }
      ),
    };
  }
}

/**
 * Creates a standard error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  fieldErrors?: Record<string, string[]>
): NextResponse<ValidationErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(fieldErrors && { fieldErrors }),
    } as ValidationErrorResponse,
    { status }
  );
}

/**
 * Creates a standard success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    } as SuccessResponse<T>,
    { status }
  );
}

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().url('Invalid URL format');
