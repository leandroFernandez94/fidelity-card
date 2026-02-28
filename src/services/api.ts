type ApiErrorDetails = Record<string, unknown> | string | null;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorDetails;

  constructor(message: string, status: number, details?: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function isJsonResponse(contentType: string | null) {
  return Boolean(contentType && contentType.includes('application/json'));
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resolveErrorMessage(data: ApiErrorDetails, fallback: string) {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const message = (data as Record<string, unknown>).message;
    const error = (data as Record<string, unknown>).error;
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include'
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  const data = isJsonResponse(contentType) ? await parseJsonResponse(response) : await response.text();

  if (!response.ok) {
    const message = resolveErrorMessage(data, response.statusText || 'Request failed');
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export function get<T>(path: string, init?: RequestInit) {
  return request<T>(path, { ...init, method: 'GET' });
}

export function post<T>(path: string, body?: unknown, init?: RequestInit) {
  return request<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export function patch<T>(path: string, body?: unknown, init?: RequestInit) {
  return request<T>(path, {
    ...init,
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export function del<T>(path: string, init?: RequestInit) {
  return request<T>(path, { ...init, method: 'DELETE' });
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}
