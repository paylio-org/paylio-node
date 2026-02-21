import { describe, it, expect, vi } from "vitest";
import { SubscriptionService } from "../src/services/subscriptionService.js";
import {
  Subscription,
  SubscriptionCancel,
  SubscriptionHistoryItem,
  PaginatedList,
} from "../src/resources/subscription.js";
import type { HTTPClient } from "../src/httpClient.js";

function makeMockHTTP(data: Record<string, unknown>): HTTPClient {
  return {
    request: vi.fn().mockResolvedValue(data),
    close: vi.fn(),
  } as unknown as HTTPClient;
}

describe("SubscriptionService", () => {
  describe("retrieve", () => {
    it("returns a Subscription instance", async () => {
      const http = makeMockHTTP({ id: "sub_1", status: "active", plan: { name: "Pro" } });
      const service = new SubscriptionService(http);
      const result = await service.retrieve("user_1");
      expect(result).toBeInstanceOf(Subscription);
    });

    it("passes correct method and path", async () => {
      const http = makeMockHTTP({ id: "sub_1", status: "active" });
      const service = new SubscriptionService(http);
      await service.retrieve("user_1");
      expect(http.request).toHaveBeenCalledWith("GET", "/subscription/user_1");
    });

    it("provides dot access to fields", async () => {
      const http = makeMockHTTP({
        id: "sub_1",
        status: "active",
        plan: { name: "Pro", amount: 999 },
      });
      const service = new SubscriptionService(http);
      const sub = await service.retrieve("user_1");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((sub as any).status).toBe("active");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((sub as any).plan.name).toBe("Pro");
    });

    it("throws on empty userId", async () => {
      const http = makeMockHTTP({});
      const service = new SubscriptionService(http);
      await expect(service.retrieve("")).rejects.toThrow("userId is required");
    });

    it("throws on whitespace userId", async () => {
      const http = makeMockHTTP({});
      const service = new SubscriptionService(http);
      await expect(service.retrieve("   ")).rejects.toThrow("userId is required");
    });
  });

  describe("list", () => {
    it("returns a PaginatedList with SubscriptionHistoryItem items", async () => {
      const http = makeMockHTTP({
        items: [{ plan_name: "Pro" }, { plan_name: "Basic" }],
        page: 1,
        total_pages: 3,
      });
      const service = new SubscriptionService(http);
      const result = await service.list("user_1");
      expect(result).toBeInstanceOf(PaginatedList);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (result as any).items as SubscriptionHistoryItem[];
      expect(items).toHaveLength(2);
      expect(items[0]).toBeInstanceOf(SubscriptionHistoryItem);
    });

    it("forwards pagination params", async () => {
      const http = makeMockHTTP({ items: [], page: 2, total_pages: 5 });
      const service = new SubscriptionService(http);
      await service.list("user_1", { page: 2, pageSize: 10 });
      expect(http.request).toHaveBeenCalledWith("GET", "/users/user_1/subscriptions", {
        params: { page: 2, page_size: 10 },
      });
    });

    it("uses default pagination params", async () => {
      const http = makeMockHTTP({ items: [], page: 1, total_pages: 1 });
      const service = new SubscriptionService(http);
      await service.list("user_1");
      expect(http.request).toHaveBeenCalledWith("GET", "/users/user_1/subscriptions", {
        params: { page: 1, page_size: 20 },
      });
    });

    it("hasMore returns true when more pages exist", async () => {
      const http = makeMockHTTP({ items: [], page: 1, total_pages: 3 });
      const service = new SubscriptionService(http);
      const result = await service.list("user_1");
      expect(result.hasMore).toBe(true);
    });

    it("hasMore returns false on last page", async () => {
      const http = makeMockHTTP({ items: [], page: 3, total_pages: 3 });
      const service = new SubscriptionService(http);
      const result = await service.list("user_1");
      expect(result.hasMore).toBe(false);
    });

    it("handles response without items key", async () => {
      const http = makeMockHTTP({ page: 1, total_pages: 1 });
      const service = new SubscriptionService(http);
      const result = await service.list("user_1");
      expect(result).toBeInstanceOf(PaginatedList);
    });

    it("throws on empty userId", async () => {
      const http = makeMockHTTP({});
      const service = new SubscriptionService(http);
      await expect(service.list("")).rejects.toThrow("userId is required");
    });

    it("throws on whitespace userId", async () => {
      const http = makeMockHTTP({});
      const service = new SubscriptionService(http);
      await expect(service.list("  ")).rejects.toThrow("userId is required");
    });
  });

  describe("cancel", () => {
    it("returns a SubscriptionCancel instance", async () => {
      const http = makeMockHTTP({ success: true, cancel_at_period_end: true });
      const service = new SubscriptionService(http);
      const result = await service.cancel("sub_123");
      expect(result).toBeInstanceOf(SubscriptionCancel);
    });

    it("sends correct path and body (default cancelNow=false)", async () => {
      const http = makeMockHTTP({ success: true });
      const service = new SubscriptionService(http);
      await service.cancel("sub_123");
      expect(http.request).toHaveBeenCalledWith("POST", "/subscription/sub_123/cancel", {
        jsonBody: { cancel_at_period_end: true },
      });
    });

    it("cancelNow=true sends cancel_at_period_end=false", async () => {
      const http = makeMockHTTP({ success: true });
      const service = new SubscriptionService(http);
      await service.cancel("sub_123", { cancelNow: true });
      expect(http.request).toHaveBeenCalledWith("POST", "/subscription/sub_123/cancel", {
        jsonBody: { cancel_at_period_end: false },
      });
    });

    it("default is safe (cancel_at_period_end=true)", async () => {
      const http = makeMockHTTP({ success: true });
      const service = new SubscriptionService(http);
      await service.cancel("sub_123");
      const callArgs = (http.request as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[2]).toEqual({ jsonBody: { cancel_at_period_end: true } });
    });

    it("throws on empty subscriptionId", async () => {
      const http = makeMockHTTP({});
      const service = new SubscriptionService(http);
      await expect(service.cancel("")).rejects.toThrow("subscriptionId is required");
    });

    it("throws on whitespace subscriptionId", async () => {
      const http = makeMockHTTP({});
      const service = new SubscriptionService(http);
      await expect(service.cancel("  ")).rejects.toThrow("subscriptionId is required");
    });
  });
});
