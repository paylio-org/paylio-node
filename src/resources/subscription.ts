import { PaylioObject } from "../paylioObject.js";

export class Subscription extends PaylioObject {
  static readonly OBJECT_NAME = "subscription";
}

export class SubscriptionCancel extends PaylioObject {
  static readonly OBJECT_NAME = "subscription_cancel";
}

export class SubscriptionHistoryItem extends PaylioObject {
  static readonly OBJECT_NAME = "subscription_history_item";
}

export class PaginatedList extends PaylioObject {
  static readonly OBJECT_NAME = "list";

  get hasMore(): boolean {
    const page = (this.get("page", 1) ?? 1) as number;
    const totalPages = (this.get("total_pages", 1) ?? 1) as number;
    return page < totalPages;
  }
}
