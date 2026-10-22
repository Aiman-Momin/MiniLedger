const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }

  get fieldErrors(): FieldError[] {
    return Array.isArray(this.details) ? this.details : [];
  }
}

let authToken: string | null = null;
let handleUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  handleUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: object | FormData;
};

export async function apiRequest<T>(path: string, { method = 'GET', body }: RequestOptions = {}) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let payload: string | FormData | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(`Could not reach the server at ${baseUrl}`, 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && authToken) {
      handleUnauthorized?.();
    }
    throw new ApiError(
      data?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      data?.error?.details,
    );
  }

  return data as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
