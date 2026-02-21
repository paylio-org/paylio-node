import { describe, it, expect } from "vitest";
import {
  Subscription,
  SubscriptionCancel,
  SubscriptionHistoryItem,
  PaginatedList,
} from "../src/resources/subscription.js";
import { PaylioObject } from "../src/paylioObject.js";

describe("Subscription", () => {
  it("is an instance of PaylioObject", () => {
    const sub = new Subscription({ id: "sub_1", status: "active" });
    expect(sub).toBeInstanceOf(PaylioObject);
  });

  it("has correct OBJECT_NAME", () => {
    expect(Subscription.OBJECT_NAME).toBe("subscription");
  });

  it("supports dot access", () => {
    const sub = new Subscription({ id: "sub_1", status: "active" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sub as any).status).toBe("active");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sub as any).id).toBe("sub_1");
  });
});

describe("SubscriptionCancel", () => {
  it("is an instance of PaylioObject", () => {
    const cancel = new SubscriptionCancel({ success: true });
    expect(cancel).toBeInstanceOf(PaylioObject);
  });

  it("has correct OBJECT_NAME", () => {
    expect(SubscriptionCancel.OBJECT_NAME).toBe("subscription_cancel");
  });
});

describe("SubscriptionHistoryItem", () => {
  it("is an instance of PaylioObject", () => {
    const item = new SubscriptionHistoryItem({ plan_name: "Pro" });
    expect(item).toBeInstanceOf(PaylioObject);
  });

  it("has correct OBJECT_NAME", () => {
    expect(SubscriptionHistoryItem.OBJECT_NAME).toBe("subscription_history_item");
  });
});

describe("PaginatedList", () => {
  it("is an instance of PaylioObject", () => {
    const list = new PaginatedList({ items: [], page: 1, total_pages: 3 });
    expect(list).toBeInstanceOf(PaylioObject);
  });

  it("has correct OBJECT_NAME", () => {
    expect(PaginatedList.OBJECT_NAME).toBe("list");
  });

  it("hasMore returns true when page < total_pages", () => {
    const list = new PaginatedList({ page: 1, total_pages: 3 });
    expect(list.hasMore).toBe(true);
  });

  it("hasMore returns false when page >= total_pages", () => {
    const list = new PaginatedList({ page: 3, total_pages: 3 });
    expect(list.hasMore).toBe(false);
  });

  it("hasMore returns false when fields are missing", () => {
    const list = new PaginatedList({});
    expect(list.hasMore).toBe(false);
  });

  it("hasMore returns false when page equals total_pages", () => {
    const list = new PaginatedList({ page: 2, total_pages: 2 });
    expect(list.hasMore).toBe(false);
  });
});
