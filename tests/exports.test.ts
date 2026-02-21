import { describe, it, expect } from "vitest";
import {
  PaylioClient,
  PaylioError,
  APIError,
  APIConnectionError,
  AuthenticationError,
  InvalidRequestError,
  NotFoundError,
  RateLimitError,
  PaylioObject,
  Subscription,
  SubscriptionCancel,
  SubscriptionHistoryItem,
  PaginatedList,
  VERSION,
} from "../src/index.js";

describe("Top-level exports", () => {
  it("exports PaylioClient", () => {
    expect(PaylioClient).toBeDefined();
    expect(typeof PaylioClient).toBe("function");
  });

  it("exports all error classes", () => {
    expect(PaylioError).toBeDefined();
    expect(APIError).toBeDefined();
    expect(APIConnectionError).toBeDefined();
    expect(AuthenticationError).toBeDefined();
    expect(InvalidRequestError).toBeDefined();
    expect(NotFoundError).toBeDefined();
    expect(RateLimitError).toBeDefined();
  });

  it("exports PaylioObject", () => {
    expect(PaylioObject).toBeDefined();
    expect(typeof PaylioObject).toBe("function");
  });

  it("exports resource classes", () => {
    expect(Subscription).toBeDefined();
    expect(SubscriptionCancel).toBeDefined();
    expect(SubscriptionHistoryItem).toBeDefined();
    expect(PaginatedList).toBeDefined();
  });

  it("exports VERSION as 0.1.0", () => {
    expect(VERSION).toBe("0.1.0");
  });
});
