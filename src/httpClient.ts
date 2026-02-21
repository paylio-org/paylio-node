import {
  APIConnectionError,
  APIError,
  AuthenticationError,
  InvalidRequestError,
  NotFoundError,
  PaylioError,
  RateLimitError,
} from "./errors.js";
import { VERSION } from "./version.js";

export const DEFAULT_BASE_URL = "https://api.paylio.pro/flying/v1";
export const DEFAULT_TIMEOUT = 30_000;

export interface HTTPClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  fetchFn?: typeof fetch;
}

export class HTTPClient {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;
  private readonly _timeout: number;
  private readonly _fetchFn: typeof fetch;

  constructor(options: HTTPClientOptions) {
    this._apiKey = options.apiKey;
    this._baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this._timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this._fetchFn = options.fetchFn ?? globalThis.fetch;
  }

  async request(
    method: string,
    path: string,
    options?: {
      params?: Record<string, string | number>;
      jsonBody?: Record<string, unknown>;
    },
  ): Promise<Record<string, unknown>> {
    const url = new URL(`${this._baseUrl}${path}`);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = this._buildHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._timeout);

    let response: Response;
    try {
      response = await this._fetchFn(url.toString(), {
        method,
        headers,
        body: options?.jsonBody ? JSON.stringify(options.jsonBody) : undefined,
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new APIConnectionError({ message: "Request timed out" });
      }
      throw new APIConnectionError({
        message: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    return this._handleResponse(response);
  }

  private _buildHeaders(): Record<string, string> {
    return {
      "X-API-Key": this._apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": `paylio-node/${VERSION}`,
      "X-SDK-Source": "node",
    };
  }

  private async _handleResponse(response: Response): Promise<Record<string, unknown>> {
    const httpStatus = response.status;
    const httpBody = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let jsonBody: Record<string, unknown> | undefined;
    try {
      jsonBody = JSON.parse(httpBody) as Record<string, unknown>;
    } catch {
      jsonBody = undefined;
    }

    if (httpStatus >= 200 && httpStatus < 300) {
      if (!jsonBody) {
        throw new APIError({
          message: "Invalid JSON in response body",
          httpStatus,
          httpBody,
        });
      }
      return jsonBody;
    }

    // Extract error details — handle all 3 backend response formats:
    //   {"error": {"code": "...", "message": "..."}}  (public API v1)
    //   {"error": "string"}                           (legacy API)
    //   {"detail": "string"}                          (FastAPI / dashboard)
    let errorCode: string | undefined;
    let errorMessage: string = httpBody;

    if (jsonBody) {
      const err = jsonBody["error"];
      if (err && typeof err === "object" && !Array.isArray(err)) {
        const errObj = err as Record<string, unknown>;
        errorCode = typeof errObj["code"] === "string" ? errObj["code"] : undefined;
        errorMessage =
          typeof errObj["message"] === "string" ? (errObj["message"] as string) : httpBody;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (typeof jsonBody["detail"] === "string") {
        errorMessage = jsonBody["detail"] as string;
      }
    }

    const ErrorClass = errorClassForStatus(httpStatus);
    throw new ErrorClass({
      message: errorMessage,
      httpStatus,
      httpBody,
      jsonBody,
      headers,
      code: errorCode,
    });
  }

  close(): void {
    // No-op for fetch-based client. Included for API parity with Python SDK.
  }
}

function errorClassForStatus(status: number): typeof PaylioError {
  switch (status) {
    case 401:
      return AuthenticationError;
    case 400:
      return InvalidRequestError;
    case 404:
      return NotFoundError;
    case 429:
      return RateLimitError;
    default:
      return APIError;
  }
}
