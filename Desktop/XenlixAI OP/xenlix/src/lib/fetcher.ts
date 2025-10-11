'use client';

import { ValidationErrorResponse, SuccessResponse } from '@/lib/validation';

// Fetcher options
export interface FetcherOptions extends RequestInit {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  suppressErrors?: boolean;
}

// Fetcher error class
export class FetcherError extends Error {
  public status: number;
  public fieldErrors?: Record<string, string[]>;
  public originalResponse: Response;

  constructor(
    message: string,
    status: number,
    originalResponse: Response,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'FetcherError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.originalResponse = originalResponse;
  }
}

// Toast function type (will be injected)
type ToastFunction = (toast: {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}) => void;

let toastFn: ToastFunction | null = null;

// Set toast function (called from components that have access to useToast)
export function setToastFunction(fn: ToastFunction) {
  toastFn = fn;
}

/**
 * Enhanced fetch wrapper with automatic error handling and toast notifications
 */
export async function fetcher<T = any>(url: string, options: FetcherOptions = {}): Promise<T> {
  const {
    showSuccessToast = false,
    successMessage = 'Operation completed successfully',
    showErrorToast = true,
    suppressErrors = false,
    ...fetchOptions
  } = options;

  // Default headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
    });

    // Handle different response types
    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle successful responses
    if (response.ok) {
      if (showSuccessToast && toastFn) {
        toastFn({
          type: 'success',
          title: successMessage,
        });
      }

      // Return the data directly for success responses
      if (data && typeof data === 'object' && 'success' in data && data.success) {
        return (data as SuccessResponse<T>).data;
      }

      return data;
    }

    // Handle error responses
    const errorResponse = data as ValidationErrorResponse;

    // Create detailed error message
    let errorMessage = errorResponse?.error || `HTTP ${response.status}: ${response.statusText}`;

    // Add field errors to message if available
    if (errorResponse?.fieldErrors) {
      const fieldErrorMessages = Object.entries(errorResponse.fieldErrors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ');
      errorMessage += ` (${fieldErrorMessages})`;
    }

    // Show error toast if enabled
    if (showErrorToast && toastFn && !suppressErrors) {
      const title =
        response.status >= 500
          ? 'Server Error'
          : response.status === 401
            ? 'Authentication Required'
            : response.status === 403
              ? 'Access Denied'
              : response.status === 404
                ? 'Not Found'
                : 'Request Failed';

      toastFn({
        type: 'error',
        title,
        message: errorMessage,
      });
    }

    // Throw detailed error
    throw new FetcherError(errorMessage, response.status, response, errorResponse?.fieldErrors);
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof FetcherError) {
      throw error;
    }

    const networkError = 'Network error or server unavailable';

    if (showErrorToast && toastFn && !suppressErrors) {
      toastFn({
        type: 'error',
        title: 'Connection Error',
        message: networkError,
      });
    }

    throw new FetcherError(networkError, 0, new Response(), undefined);
  }
}

// Convenience methods for common HTTP verbs
export const api = {
  get: <T = any>(url: string, options?: Omit<FetcherOptions, 'method'>) =>
    fetcher<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: Omit<FetcherOptions, 'method' | 'body'>) =>
    fetcher<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: Omit<FetcherOptions, 'method' | 'body'>) =>
    fetcher<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: Omit<FetcherOptions, 'method' | 'body'>) =>
    fetcher<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: Omit<FetcherOptions, 'method'>) =>
    fetcher<T>(url, { ...options, method: 'DELETE' }),
};
