import { AuthenticationError } from "./errors.js";
import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT, HTTPClient } from "./httpClient.js";
import { SubscriptionService } from "./services/subscriptionService.js";

export interface PaylioClientOptions {
  baseUrl?: string;
  timeout?: number;
  fetchFn?: typeof fetch;
}

export class PaylioClient {
  private readonly _http: HTTPClient;
  readonly subscription: SubscriptionService;

  constructor(apiKey: string, options?: PaylioClientOptions) {
    if (!apiKey) {
      throw new AuthenticationError({
        message:
          "No API key provided. Set your API key when creating " +
          "the PaylioClient: new PaylioClient('sk_live_xxx')",
      });
    }

    this._http = new HTTPClient({
      apiKey,
      baseUrl: options?.baseUrl ?? DEFAULT_BASE_URL,
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      fetchFn: options?.fetchFn,
    });

    this.subscription = new SubscriptionService(this._http);
  }

  close(): void {
    this._http.close();
  }

  [Symbol.dispose](): void {
    this.close();
  }
}
