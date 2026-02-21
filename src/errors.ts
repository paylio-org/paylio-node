export interface PaylioErrorParams {
  message?: string;
  httpStatus?: number;
  httpBody?: string;
  jsonBody?: Record<string, unknown>;
  headers?: Record<string, string>;
  code?: string;
}

export class PaylioError extends Error {
  readonly httpStatus: number | undefined;
  readonly httpBody: string | undefined;
  readonly jsonBody: Record<string, unknown> | undefined;
  readonly headers: Record<string, string>;
  readonly code: string | undefined;

  constructor(params?: PaylioErrorParams) {
    const msg = params?.message ?? "";
    super(msg);
    this.name = this.constructor.name;
    this.message = msg;
    this.httpStatus = params?.httpStatus;
    this.httpBody = params?.httpBody;
    this.jsonBody = params?.jsonBody;
    this.headers = params?.headers ?? {};
    this.code = params?.code;
  }

  override toString(): string {
    return this.message;
  }
}

/** General API error (5xx or unexpected responses). */
export class APIError extends PaylioError {}

/** Invalid or missing API key (401). */
export class AuthenticationError extends PaylioError {}

/** Bad request parameters (400). */
export class InvalidRequestError extends PaylioError {}

/** Resource not found (404). */
export class NotFoundError extends PaylioError {}

/** Rate limit exceeded (429). */
export class RateLimitError extends PaylioError {}

/** Network/connection failure. */
export class APIConnectionError extends PaylioError {}
