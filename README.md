# Paylio Node.js SDK

Official Node.js/TypeScript client library for the [Paylio API](https://api.paylio.pro).

## Requirements

- Node.js 18 or later

## Installation

```bash
npm install paylio
```

## Usage

### TypeScript

```typescript
import { PaylioClient, AuthenticationError } from "paylio";

const client = new PaylioClient("sk_live_xxx");

// Retrieve current subscription
const sub = await client.subscription.retrieve("user_123");
console.log(sub.status, sub.plan.name);

// List subscription history
const history = await client.subscription.list("user_123", { page: 1, pageSize: 10 });
for (const item of history.items) {
  console.log(item.plan_name);
}
console.log(history.hasMore);

// Cancel a subscription (safe default: at end of billing period)
const result = await client.subscription.cancel("sub_uuid");
console.log(result.success);

// Cancel immediately
await client.subscription.cancel("sub_uuid", { cancelNow: true });

client.close();
```

### JavaScript (CommonJS)

```javascript
const { PaylioClient } = require("paylio");

const client = new PaylioClient("sk_live_xxx");
const sub = await client.subscription.retrieve("user_123");
console.log(sub.status);
client.close();
```

### Error Handling

```typescript
import { PaylioClient, AuthenticationError, NotFoundError, PaylioError } from "paylio";

const client = new PaylioClient("sk_live_xxx");

try {
  await client.subscription.retrieve("user_123");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key:", error.message);
  } else if (error instanceof NotFoundError) {
    console.error("Subscription not found:", error.message);
  } else if (error instanceof PaylioError) {
    console.error(`API error ${error.httpStatus}: ${error.message}`);
  }
}

client.close();
```

### Custom Configuration

```typescript
const client = new PaylioClient("sk_live_xxx", {
  baseUrl: "https://custom.api.com/v1",
  timeout: 60_000, // 60 seconds
});
```

## Error Types

| Error | HTTP Status | Description |
|---|---|---|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `InvalidRequestError` | 400 | Bad request parameters |
| `NotFoundError` | 404 | Resource not found |
| `RateLimitError` | 429 | Rate limit exceeded |
| `APIError` | 5xx | Server error or unexpected response |
| `APIConnectionError` | — | Network or connection failure |

All errors extend `PaylioError`, which extends `Error`.

## License

MIT
