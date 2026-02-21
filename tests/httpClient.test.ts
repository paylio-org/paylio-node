import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HTTPClient, DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from "../src/httpClient.js";
import {
  APIError,
  APIConnectionError,
  AuthenticationError,
  InvalidRequestError,
  NotFoundError,
  RateLimitError,
} from "../src/errors.js";
import { VERSION } from "../src/version.js";

function makeResponse(status: number, body: string, headers?: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("HTTPClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: HTTPClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new HTTPClient({ apiKey: "sk_test_123", fetchFn: mockFetch });
  });

  afterEach(() => {
    client.close();
  });

  describe("headers", () => {
    it("sends X-API-Key header", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("GET", "/test");
      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers["X-API-Key"]).toBe("sk_test_123");
    });

    it("sends User-Agent with version", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("GET", "/test");
      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers["User-Agent"]).toBe(`paylio-node/${VERSION}`);
    });

    it("sends Content-Type and Accept as application/json", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("GET", "/test");
      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers["Content-Type"]).toBe("application/json");
      expect(init.headers["Accept"]).toBe("application/json");
    });
  });

  describe("success responses", () => {
    it("returns parsed JSON body", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"id":"sub_1","status":"active"}'));
      const result = await client.request("GET", "/subscription/user_1");
      expect(result).toEqual({ id: "sub_1", status: "active" });
    });

    it("throws APIError for non-JSON success body", async () => {
      mockFetch.mockResolvedValueOnce(new Response("not json", { status: 200 }));
      await expect(client.request("GET", "/test")).rejects.toThrow(APIError);
    });

    it("includes correct message for non-JSON success", async () => {
      mockFetch.mockResolvedValueOnce(new Response("not json", { status: 200 }));
      await expect(client.request("GET", "/test")).rejects.toThrow("Invalid JSON in response body");
    });
  });

  describe("error status mapping", () => {
    it("401 throws AuthenticationError", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(401, '{"error":{"code":"invalid_api_key","message":"Bad key"}}'),
      );
      await expect(client.request("GET", "/test")).rejects.toThrow(AuthenticationError);
    });

    it("400 throws InvalidRequestError", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(400, '{"error":{"code":"invalid_param","message":"Bad param"}}'),
      );
      await expect(client.request("GET", "/test")).rejects.toThrow(InvalidRequestError);
    });

    it("404 throws NotFoundError", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(404, '{"error":"not found"}'));
      await expect(client.request("GET", "/test")).rejects.toThrow(NotFoundError);
    });

    it("429 throws RateLimitError", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(429, '{"error":"rate limited"}'));
      await expect(client.request("GET", "/test")).rejects.toThrow(RateLimitError);
    });

    it("500 throws APIError", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(500, '{"error":"internal"}'));
      await expect(client.request("GET", "/test")).rejects.toThrow(APIError);
    });
  });

  describe("error response formats", () => {
    it("parses v1 structured format: {error: {code, message}}", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(401, '{"error":{"code":"invalid_api_key","message":"Bad key"}}'),
      );
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as AuthenticationError;
        expect(err.message).toBe("Bad key");
        expect(err.code).toBe("invalid_api_key");
        expect(err.httpStatus).toBe(401);
        expect(err.jsonBody).toEqual({ error: { code: "invalid_api_key", message: "Bad key" } });
      }
    });

    it("parses legacy format: {error: string}", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(401, '{"error":"unauthorized"}'));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as AuthenticationError;
        expect(err.message).toBe("unauthorized");
        expect(err.code).toBeUndefined();
      }
    });

    it("parses FastAPI format: {detail: string}", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(400, '{"detail":"bad request"}'));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as InvalidRequestError;
        expect(err.message).toBe("bad request");
        expect(err.code).toBeUndefined();
      }
    });

    it("falls back to raw body for non-JSON error", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Server Error", { status: 500 }));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as APIError;
        expect(err.message).toBe("Server Error");
        expect(err.jsonBody).toBeUndefined();
        expect(err.httpBody).toBe("Server Error");
      }
    });

    it("falls back to raw body for unrecognised JSON shape", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(500, '{"foo":"bar"}'));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as APIError;
        expect(err.message).toBe('{"foo":"bar"}');
      }
    });

    it("preserves httpBody on all errors", async () => {
      const body = '{"error":{"code":"c","message":"m"}}';
      mockFetch.mockResolvedValueOnce(makeResponse(400, body));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as InvalidRequestError;
        expect(err.httpBody).toBe(body);
      }
    });

    it("preserves response headers on errors", async () => {
      mockFetch.mockResolvedValueOnce(
        makeResponse(400, '{"error":"bad"}', { "x-request-id": "req_abc" }),
      );
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as InvalidRequestError;
        expect(err.headers["x-request-id"]).toBe("req_abc");
      }
    });
  });

  describe("connection errors", () => {
    it("wraps network error into APIConnectionError", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));
      await expect(client.request("GET", "/test")).rejects.toThrow(APIConnectionError);
    });

    it("includes original message in connection error", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as APIConnectionError;
        expect(err.message).toContain("fetch failed");
      }
    });

    it("does not leak cause chain", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as APIConnectionError;
        expect(err.cause).toBeUndefined();
      }
    });

    it("wraps AbortError as timeout", async () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      mockFetch.mockRejectedValueOnce(abortError);
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as APIConnectionError;
        expect(err).toBeInstanceOf(APIConnectionError);
        expect(err.message).toContain("timed out");
      }
    });
  });

  describe("request building", () => {
    it("builds URL with default base URL", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("GET", "/subscription/user_1");
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe(`${DEFAULT_BASE_URL}/subscription/user_1`);
    });

    it("uses custom base URL", async () => {
      const customClient = new HTTPClient({
        apiKey: "sk_test",
        baseUrl: "https://custom.api.com/v2/",
        fetchFn: mockFetch,
      });
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await customClient.request("GET", "/test");
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://custom.api.com/v2/test");
    });

    it("appends query params for GET", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("GET", "/list", { params: { page: 2, page_size: 10 } });
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=2");
      expect(url).toContain("page_size=10");
    });

    it("sends JSON body for POST", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("POST", "/cancel", { jsonBody: { cancel_at_period_end: true } });
      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({ cancel_at_period_end: true });
    });

    it("sends no body when jsonBody is undefined", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(200, '{"ok":true}'));
      await client.request("GET", "/test");
      const [, init] = mockFetch.mock.calls[0];
      expect(init.body).toBeUndefined();
    });
  });

  describe("error format edge cases", () => {
    it("error object with non-string code defaults code to undefined", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(400, '{"error":{"code":123,"message":"bad"}}'));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as InvalidRequestError;
        expect(err.code).toBeUndefined();
        expect(err.message).toBe("bad");
      }
    });

    it("error object with non-string message falls back to httpBody", async () => {
      const body = '{"error":{"code":"c","message":123}}';
      mockFetch.mockResolvedValueOnce(makeResponse(400, body));
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as InvalidRequestError;
        expect(err.message).toBe(body);
        expect(err.code).toBe("c");
      }
    });

    it("wraps non-Error thrown from fetch", async () => {
      mockFetch.mockRejectedValueOnce("string error");
      try {
        await client.request("GET", "/test");
      } catch (e) {
        const err = e as APIConnectionError;
        expect(err).toBeInstanceOf(APIConnectionError);
        expect(err.message).toContain("string error");
      }
    });
  });

  describe("defaults", () => {
    it("default base URL is correct", () => {
      expect(DEFAULT_BASE_URL).toBe("https://api.paylio.pro/flying/v1");
    });

    it("default timeout is 30 seconds", () => {
      expect(DEFAULT_TIMEOUT).toBe(30_000);
    });

    it("uses globalThis.fetch when no fetchFn provided", () => {
      // Just verify the constructor doesn't throw when no fetchFn
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn();
      try {
        const c = new HTTPClient({ apiKey: "sk_test" });
        expect(c).toBeInstanceOf(HTTPClient);
        c.close();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("close", () => {
    it("close is callable without error", () => {
      expect(() => client.close()).not.toThrow();
    });
  });
});
