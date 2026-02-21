import { describe, it, expect } from "vitest";
import { PaylioObject } from "../src/paylioObject.js";

describe("PaylioObject", () => {
  describe("construction", () => {
    it("creates from data object", () => {
      const obj = new PaylioObject({ status: "active", id: "sub_1" });
      expect((obj as Record<string, unknown>)["status"]).toBe("active");
      expect((obj as Record<string, unknown>)["id"]).toBe("sub_1");
    });

    it("creates empty object when no data provided", () => {
      const obj = new PaylioObject();
      expect(obj.toDict()).toEqual({});
    });

    it("creates empty object from undefined", () => {
      const obj = new PaylioObject(undefined);
      expect(obj.toDict()).toEqual({});
    });
  });

  describe("dot access", () => {
    it("reads property via dot notation", () => {
      const obj = new PaylioObject({ status: "active" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).status).toBe("active");
    });

    it("sets property via dot notation", () => {
      const obj = new PaylioObject({ status: "active" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).name = "test";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).name).toBe("test");
    });

    it("returns undefined for missing property", () => {
      const obj = new PaylioObject({ status: "active" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).missing).toBeUndefined();
    });
  });

  describe("bracket access", () => {
    it("reads property via bracket notation", () => {
      const obj = new PaylioObject({ status: "active" });
      expect((obj as Record<string, unknown>)["status"]).toBe("active");
    });

    it("sets property via bracket notation", () => {
      const obj = new PaylioObject({});
      (obj as Record<string, unknown>)["name"] = "test";
      expect((obj as Record<string, unknown>)["name"]).toBe("test");
    });

    it("returns undefined for missing key", () => {
      const obj = new PaylioObject({});
      expect((obj as Record<string, unknown>)["missing"]).toBeUndefined();
    });
  });

  describe("get method", () => {
    it("returns value for existing key", () => {
      const obj = new PaylioObject({ page: 2 });
      expect(obj.get("page")).toBe(2);
    });

    it("returns default for missing key", () => {
      const obj = new PaylioObject({});
      expect(obj.get("page", 1)).toBe(1);
    });

    it("returns undefined when no default and key missing", () => {
      const obj = new PaylioObject({});
      expect(obj.get("page")).toBeUndefined();
    });
  });

  describe("nested wrapping", () => {
    it("wraps nested dict into PaylioObject", () => {
      const obj = new PaylioObject({ plan: { name: "Pro", amount: 999 } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = (obj as any).plan;
      expect(plan).toBeInstanceOf(PaylioObject);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((plan as any).name).toBe("Pro");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((plan as any).amount).toBe(999);
    });

    it("wraps dict items in arrays into PaylioObject", () => {
      const obj = new PaylioObject({
        items: [{ id: "a" }, { id: "b" }],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (obj as any).items as PaylioObject[];
      expect(items[0]).toBeInstanceOf(PaylioObject);
      expect(items[1]).toBeInstanceOf(PaylioObject);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((items[0] as any).id).toBe("a");
    });

    it("preserves non-dict items in arrays", () => {
      const obj = new PaylioObject({ tags: ["a", "b", "c"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).tags).toEqual(["a", "b", "c"]);
    });

    it("does not re-wrap existing PaylioObject", () => {
      const inner = new PaylioObject({ id: "inner" });
      const obj = new PaylioObject({ nested: inner });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).nested).toBe(inner);
    });

    it("does not re-wrap PaylioObject in array", () => {
      const inner = new PaylioObject({ id: "item" });
      const obj = new PaylioObject({ items: [inner] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((obj as any).items as PaylioObject[])[0]).toBe(inner);
    });

    it("passes through plain values", () => {
      const obj = new PaylioObject({
        count: 42,
        active: true,
        rate: 3.14,
        empty: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).count).toBe(42);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).active).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).rate).toBe(3.14);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).empty).toBeNull();
    });
  });

  describe("toDict", () => {
    it("converts flat object to plain dict", () => {
      const obj = new PaylioObject({ status: "active", id: "sub_1" });
      const result = obj.toDict();
      expect(result).toEqual({ status: "active", id: "sub_1" });
      expect(result).not.toBeInstanceOf(PaylioObject);
    });

    it("recursively unwraps nested PaylioObjects", () => {
      const obj = new PaylioObject({
        plan: { name: "Pro", tier: { level: 2 } },
      });
      const result = obj.toDict();
      expect(result).toEqual({
        plan: { name: "Pro", tier: { level: 2 } },
      });
    });

    it("recursively unwraps PaylioObjects in arrays", () => {
      const obj = new PaylioObject({
        items: [{ id: "a" }, { id: "b" }],
      });
      const result = obj.toDict();
      expect(result).toEqual({ items: [{ id: "a" }, { id: "b" }] });
    });

    it("preserves non-object array items", () => {
      const obj = new PaylioObject({ tags: ["x", "y"] });
      const result = obj.toDict();
      expect(result).toEqual({ tags: ["x", "y"] });
    });
  });

  describe("toString", () => {
    it("shows id when present", () => {
      const obj = new PaylioObject({ id: "sub_abc" });
      expect(obj.toString()).toBe("<PaylioObject id=sub_abc>");
    });

    it("shows JSON when no id", () => {
      const obj = new PaylioObject({ status: "active" });
      expect(obj.toString()).toBe('<PaylioObject {"status":"active"}>');
    });
  });

  describe("constructFrom", () => {
    it("creates PaylioObject from data", () => {
      const obj = PaylioObject.constructFrom({ id: "x", name: "test" });
      expect(obj).toBeInstanceOf(PaylioObject);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).id).toBe("x");
    });

    it("wraps nested dicts", () => {
      const obj = PaylioObject.constructFrom({ plan: { name: "Pro" } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obj as any).plan).toBeInstanceOf(PaylioObject);
    });
  });

  describe("symbol access", () => {
    it("symbol properties resolve through Reflect.get", () => {
      const obj = new PaylioObject({ status: "active" });
      // Symbol.toPrimitive access goes through the symbol branch
      expect(obj[Symbol.toPrimitive]).toBeUndefined();
    });

    it("Symbol.iterator resolves correctly", () => {
      const obj = new PaylioObject({ status: "active" });
      // Symbol access should not throw
      expect(obj[Symbol.toStringTag]).toBeUndefined();
    });
  });

  describe("underscore prefixed access", () => {
    it("reading _data returns internal data object", () => {
      const obj = new PaylioObject({ status: "active" });
      expect(obj._data).toBeDefined();
      expect(obj._data["status"]).toBe("active");
    });

    it("setting underscore property goes to object, not data", () => {
      const obj = new PaylioObject({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any)._custom = "internal";
      // Should NOT be in _data
      expect(obj._data["_custom"]).toBeUndefined();
    });
  });

  describe("internal methods are not intercepted", () => {
    it("toDict is accessible as method", () => {
      const obj = new PaylioObject({ status: "active" });
      expect(typeof obj.toDict).toBe("function");
    });

    it("toString is accessible as method", () => {
      const obj = new PaylioObject({ status: "active" });
      expect(typeof obj.toString).toBe("function");
    });

    it("get is accessible as method", () => {
      const obj = new PaylioObject({ status: "active" });
      expect(typeof obj.get).toBe("function");
    });
  });
});
