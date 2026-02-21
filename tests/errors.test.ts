import { describe, it, expect } from "vitest";
import {
  PaylioError,
  APIError,
  APIConnectionError,
  AuthenticationError,
  InvalidRequestError,
  NotFoundError,
  RateLimitError,
} from "../src/errors.js";

describe("PaylioError", () => {
  it("stores message", () => {
    const err = new PaylioError({ message: "something went wrong" });
    expect(err.message).toBe("something went wrong");
  });

  it("carries all attributes", () => {
    const err = new PaylioError({
      message: "fail",
      httpStatus: 500,
      httpBody: '{"error":"fail"}',
      jsonBody: { error: "fail" },
      headers: { "x-request-id": "abc" },
      code: "internal",
    });
    expect(err.message).toBe("fail");
    expect(err.httpStatus).toBe(500);
    expect(err.httpBody).toBe('{"error":"fail"}');
    expect(err.jsonBody).toEqual({ error: "fail" });
    expect(err.headers).toEqual({ "x-request-id": "abc" });
    expect(err.code).toBe("internal");
  });

  it("defaults to empty message and undefined fields", () => {
    const err = new PaylioError();
    expect(err.message).toBe("");
    expect(err.httpStatus).toBeUndefined();
    expect(err.httpBody).toBeUndefined();
    expect(err.jsonBody).toBeUndefined();
    expect(err.headers).toEqual({});
    expect(err.code).toBeUndefined();
  });

  it("is an instance of Error", () => {
    const err = new PaylioError({ message: "test" });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PaylioError);
  });

  it("has correct name property", () => {
    const err = new PaylioError({ message: "test" });
    expect(err.name).toBe("PaylioError");
  });

  it("toString returns message", () => {
    const err = new PaylioError({ message: "bad request" });
    expect(err.toString()).toBe("bad request");
  });

  it("can be thrown and caught", () => {
    expect(() => {
      throw new PaylioError({ message: "thrown" });
    }).toThrow(PaylioError);
  });
});

const ALL_SUBCLASSES = [
  { cls: APIError, name: "APIError" },
  { cls: AuthenticationError, name: "AuthenticationError" },
  { cls: InvalidRequestError, name: "InvalidRequestError" },
  { cls: NotFoundError, name: "NotFoundError" },
  { cls: RateLimitError, name: "RateLimitError" },
  { cls: APIConnectionError, name: "APIConnectionError" },
] as const;

describe("Error subclasses", () => {
  for (const { cls, name } of ALL_SUBCLASSES) {
    describe(name, () => {
      it("is an instance of PaylioError", () => {
        const err = new cls({ message: "test" });
        expect(err).toBeInstanceOf(PaylioError);
      });

      it("is an instance of Error", () => {
        const err = new cls({ message: "test" });
        expect(err).toBeInstanceOf(Error);
      });

      it("is catchable as PaylioError", () => {
        let caught = false;
        try {
          throw new cls({ message: "test" });
        } catch (e) {
          if (e instanceof PaylioError) {
            caught = true;
          }
        }
        expect(caught).toBe(true);
      });

      it("carries all attributes", () => {
        const err = new cls({
          message: "err",
          httpStatus: 400,
          httpBody: "body",
          jsonBody: { k: "v" },
          headers: { h: "v" },
          code: "c",
        });
        expect(err.message).toBe("err");
        expect(err.httpStatus).toBe(400);
        expect(err.httpBody).toBe("body");
        expect(err.jsonBody).toEqual({ k: "v" });
        expect(err.headers).toEqual({ h: "v" });
        expect(err.code).toBe("c");
      });

      it("has correct name", () => {
        const err = new cls({ message: "test" });
        expect(err.name).toBe(name);
      });

      it("toString returns message", () => {
        const err = new cls({ message: "hello" });
        expect(err.toString()).toBe("hello");
      });
    });
  }
});
