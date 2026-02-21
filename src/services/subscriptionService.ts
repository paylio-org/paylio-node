import type { HTTPClient } from "../httpClient.js";
import {
  PaginatedList,
  Subscription,
  SubscriptionCancel,
  SubscriptionHistoryItem,
} from "../resources/subscription.js";

export class SubscriptionService {
  private readonly _http: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this._http = httpClient;
  }

  async retrieve(userId: string): Promise<Subscription> {
    if (!userId || !userId.trim()) {
      throw new Error("userId is required");
    }
    const data = await this._http.request("GET", `/subscription/${userId}`);
    return new Subscription(data);
  }

  async list(
    userId: string,
    options?: { page?: number; pageSize?: number },
  ): Promise<PaginatedList> {
    if (!userId || !userId.trim()) {
      throw new Error("userId is required");
    }

    const params = {
      page: options?.page ?? 1,
      page_size: options?.pageSize ?? 20,
    };

    const data = await this._http.request("GET", `/users/${userId}/subscriptions`, { params });

    // Convert items to typed objects
    if (data["items"] && Array.isArray(data["items"])) {
      data["items"] = (data["items"] as Record<string, unknown>[]).map(
        (item) => new SubscriptionHistoryItem(item),
      );
    }

    return new PaginatedList(data);
  }

  async cancel(
    subscriptionId: string,
    options?: { cancelNow?: boolean },
  ): Promise<SubscriptionCancel> {
    if (!subscriptionId || !subscriptionId.trim()) {
      throw new Error("subscriptionId is required");
    }

    const cancelNow = options?.cancelNow ?? false;
    const data = await this._http.request("POST", `/subscription/${subscriptionId}/cancel`, {
      jsonBody: { cancel_at_period_end: !cancelNow },
    });
    return new SubscriptionCancel(data);
  }
}
