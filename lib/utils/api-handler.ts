import { NextResponse } from "next/server";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError } from "@prisma/client/runtime/library";
import { z } from "zod";

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Centralized API error handler
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle different types of errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  // Custom API Error
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: error.name,
      message: error.message,
      code: error.code,
      details: error.details
    }, { status: error.statusCode });
  }

  // Zod Validation Error
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid input data',
      details: error.errors
    }, { status: 400 });
  }

  // Prisma Known Errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = error.meta?.target as string[] | undefined;
        const field = target ? target[0] : 'field';
        return NextResponse.json({
          success: false,
          error: 'Duplicate Error',
          message: `A record with this ${field} already exists`,
          code: error.code
        }, { status: 409 });
      
      case 'P2025':
        return NextResponse.json({
          success: false,
          error: 'Not Found',
          message: 'Record not found',
          code: error.code
        }, { status: 404 });
      
      case 'P2003':
        return NextResponse.json({
          success: false,
          error: 'Foreign Key Constraint',
          message: 'Referenced record does not exist',
          code: error.code
        }, { status: 400 });
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Database Error',
          message: error.message,
          code: error.code
        }, { status: 500 });
    }
  }

  // Prisma Unknown Errors
  if (error instanceof PrismaClientUnknownRequestError) {
    return NextResponse.json({
      success: false,
      error: 'Database Error',
      message: 'An unknown database error occurred',
    }, { status: 500 });
  }

  // Prisma Rust Panic Errors
  if (error instanceof PrismaClientRustPanicError) {
    return NextResponse.json({
      success: false,
      error: 'Database Connection Error',
      message: 'Database connection failed',
    }, { status: 503 });
  }

  // Generic Error
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return NextResponse.json({
    success: false,
    error: 'Internal Server Error',
    message
  }, { status: 500 });
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  }, { status });
}

/**
 * Async wrapper for API handlers with automatic error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<any>>
) {
  return async (...args: T): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Validate request parameters
 */
export async function validateParams(
  params: any, 
  schema: z.ZodSchema
): Promise<any> {
  try {
    return schema.parse(params);
  } catch (error) {
    throw new ApiError('Invalid parameters', 400, 'VALIDATION_ERROR', error);
  }
}

/**
 * Validate request body
 */
export async function validateBody(
  request: Request, 
  schema: z.ZodSchema
): Promise<any> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new ApiError('Invalid request body', 400, 'INVALID_JSON');
  }
}

/**
 * Check if record exists
 */
export async function ensureRecordExists<T>(
  record: T | null,
  resourceName: string
): Promise<T> {
  if (!record) {
    throw new ApiError(`${resourceName} not found`, 404, 'NOT_FOUND');
  }
  return record;
}
