import { describe, it, expect, vi } from "vitest";
import { PaylioClient } from "../src/client.js";
import { AuthenticationError } from "../src/errors.js";
import { SubscriptionService } from "../src/services/subscriptionService.js";

describe("PaylioClient", () => {
  describe("init", () => {
    it("creates client with API key", () => {
      const client = new PaylioClient("sk_test_123", { fetchFn: vi.fn() });
      expect(client).toBeInstanceOf(PaylioClient);
      client.close();
    });

    it("throws AuthenticationError for empty API key", () => {
      expect(() => new PaylioClient("")).toThrow(AuthenticationError);
    });

    it("throws AuthenticationError with descriptive message for empty key", () => {
      try {
        new PaylioClient("");
      } catch (e) {
        const err = e as AuthenticationError;
        expect(err.message).toContain("No API key provided");
        expect(err.message).toContain("PaylioClient");
      }
    });

    it("accepts custom base URL", () => {
      const client = new PaylioClient("sk_test", {
        baseUrl: "https://custom.api.com/v2",
        fetchFn: vi.fn(),
      });
      expect(client).toBeInstanceOf(PaylioClient);
      client.close();
    });

    it("accepts custom timeout", () => {
      const client = new PaylioClient("sk_test", { timeout: 60_000, fetchFn: vi.fn() });
      expect(client).toBeInstanceOf(PaylioClient);
      client.close();
    });

    it("accepts custom fetch function", () => {
      const customFetch = vi.fn();
      const client = new PaylioClient("sk_test", { fetchFn: customFetch });
      expect(client).toBeInstanceOf(PaylioClient);
      client.close();
    });
  });

  describe("subscription service", () => {
    it("exposes subscription as SubscriptionService", () => {
      const client = new PaylioClient("sk_test", { fetchFn: vi.fn() });
      expect(client.subscription).toBeInstanceOf(SubscriptionService);
      client.close();
    });
  });

  describe("close", () => {
    it("close is callable without error", () => {
      const client = new PaylioClient("sk_test", { fetchFn: vi.fn() });
      expect(() => client.close()).not.toThrow();
    });

    it("close can be called multiple times", () => {
      const client = new PaylioClient("sk_test", { fetchFn: vi.fn() });
      client.close();
      expect(() => client.close()).not.toThrow();
    });
  });

  describe("Symbol.dispose", () => {
    it("Symbol.dispose calls close", () => {
      const client = new PaylioClient("sk_test", { fetchFn: vi.fn() });
      expect(typeof client[Symbol.dispose]).toBe("function");
      expect(() => client[Symbol.dispose]()).not.toThrow();
    });
  });
});
