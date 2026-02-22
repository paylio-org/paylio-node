# Paylio Node.js SDK

[![npm version](https://img.shields.io/npm/v/paylio.svg)](https://www.npmjs.com/package/paylio)
[![CI](https://github.com/paylio-org/paylio-node/actions/workflows/ci.yml/badge.svg)](https://github.com/paylio-org/paylio-node/actions/workflows/ci.yml)

The Paylio Node.js SDK provides convenient access to the Paylio API from applications written in server-side JavaScript and TypeScript.

## Documentation

See the [Paylio API docs](https://paylio.pro/docs).

## Requirements

- Node.js 18+

## Installation

```bash
npm install paylio
```

## Usage

### TypeScript

```typescript
import { PaylioClient } from "paylio";

const client = new PaylioClient("sk_live_xxx");

// Retrieve current subscription
const sub = await client.subscription.retrieve("user_123");
console.log(sub.status);       // "active"
console.log(sub.plan.name);    // "Pro Plan"
console.log(sub.plan.amount);  // 999

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

### List subscription history

```typescript
const history = await client.subscription.list("user_123", {
  page: 1,
  pageSize: 10,
});

for (const item of history.items) {
  console.log(item.plan_name, item.status);
}

console.log(history.hasMore);
```

### Cancel a subscription

```typescript
// Cancel at end of billing period (safe default)
const result = await client.subscription.cancel("sub_uuid");
console.log(result.success);

// Cancel immediately
await client.subscription.cancel("sub_uuid", { cancelNow: true });
```

### Configuration

```typescript
const client = new PaylioClient("sk_live_xxx", {
  baseUrl: "https://custom-api.example.com/v1",
  timeout: 60_000, // 60 seconds
});
```

### Error handling

```typescript
import {
  PaylioClient,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  PaylioError,
} from "paylio";

const client = new PaylioClient("sk_live_xxx");

try {
  await client.subscription.retrieve("user_123");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key:", error.message);
  } else if (error instanceof NotFoundError) {
    console.error("Subscription not found:", error.message);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limited, try again later");
  } else if (error instanceof PaylioError) {
    console.error(`API error ${error.httpStatus}: ${error.message}`);
  }
}

client.close();
```

## Error types

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `InvalidRequestError` | 400 | Bad request parameters |
| `NotFoundError` | 404 | Resource not found |
| `RateLimitError` | 429 | Rate limit exceeded |
| `APIError` | 5xx | Server error |
| `APIConnectionError` | — | Network or connection failure |

All errors extend `PaylioError`, which extends `Error`.

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
```

## License

MIT
