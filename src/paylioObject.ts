/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Base class for Paylio API response objects.
 *
 * Supports both dot-style and bracket-style access:
 *   (obj as any).status  // dot access
 *   obj["status"]        // bracket access (via Proxy)
 */
export class PaylioObject {
  /** @internal */
  readonly _data: Record<string, unknown>;

  constructor(data?: Record<string, unknown>) {
    this._data = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        this._data[key] = PaylioObject._wrap(value);
      }
    }

    return new Proxy(this, {
      get(target, prop, receiver) {
        // Let class methods and internals resolve normally via prototype chain
        if (typeof prop === "symbol" || typeof prop !== "string") {
          return Reflect.get(target, prop, receiver);
        }
        // Prioritize own methods over data keys
        if (prop in target && typeof (target as any)[prop] === "function") {
          return (target as any)[prop].bind(target);
        }
        // Internal properties (starting with _) go to the real object
        if (prop.startsWith("_")) {
          return Reflect.get(target, prop, receiver);
        }
        // Data keys
        if (prop in target._data) {
          return target._data[prop];
        }
        // Fallback to prototype chain (constructor, etc.)
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value) {
        if (typeof prop === "string" && !prop.startsWith("_")) {
          target._data[prop] = value;
          return true;
        }
        return Reflect.set(target, prop, value);
      },
    });
  }

  static _wrap(value: unknown): unknown {
    if (value instanceof PaylioObject) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (item instanceof PaylioObject) return item;
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          return new PaylioObject(item as Record<string, unknown>);
        }
        return item;
      });
    }
    if (value !== null && typeof value === "object") {
      return new PaylioObject(value as Record<string, unknown>);
    }
    return value;
  }

  get(key: string, defaultValue?: unknown): unknown {
    return key in this._data ? this._data[key] : defaultValue;
  }

  toDict(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(this._data)) {
      if (value instanceof PaylioObject) {
        result[key] = value.toDict();
      } else if (Array.isArray(value)) {
        result[key] = value.map((item: any) =>
          item instanceof PaylioObject ? item.toDict() : item,
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  static constructFrom(data: Record<string, unknown>): PaylioObject {
    return new PaylioObject(data);
  }

  toString(): string {
    const id = this._data["id"];
    if (id !== undefined && id !== null) {
      return `<${this.constructor.name} id=${id}>`;
    }
    return `<${this.constructor.name} ${JSON.stringify(this._data)}>`;
  }
}
