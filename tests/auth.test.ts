import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyCredentials } from "~/lib/auth/auth.server";

describe("verifyCredentials", () => {
  const original = { user: process.env.AUTH_USERNAME, pass: process.env.AUTH_PASSWORD };

  beforeEach(() => {
    process.env.AUTH_USERNAME = "alice";
    process.env.AUTH_PASSWORD = "s3cret";
  });
  afterEach(() => {
    process.env.AUTH_USERNAME = original.user;
    process.env.AUTH_PASSWORD = original.pass;
  });

  it("accepts the configured credentials", () => {
    expect(verifyCredentials("alice", "s3cret")).toBe(true);
  });
  it("rejects a wrong password", () => {
    expect(verifyCredentials("alice", "nope")).toBe(false);
  });
  it("rejects a wrong username", () => {
    expect(verifyCredentials("bob", "s3cret")).toBe(false);
  });
  it("rejects empty input", () => {
    expect(verifyCredentials("", "")).toBe(false);
  });
});

describe("verifyCredentials — fail closed in production", () => {
  const original = {
    env: process.env.NODE_ENV,
    user: process.env.AUTH_USERNAME,
    pass: process.env.AUTH_PASSWORD,
  };

  afterEach(() => {
    process.env.NODE_ENV = original.env;
    process.env.AUTH_USERNAME = original.user;
    process.env.AUTH_PASSWORD = original.pass;
  });

  it("throws in production when credentials are not configured", () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_USERNAME;
    delete process.env.AUTH_PASSWORD;
    expect(() => verifyCredentials("admin", "password")).toThrow(/must be set in production/);
  });

  it("does NOT accept the dev defaults in production", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_USERNAME = "realuser";
    process.env.AUTH_PASSWORD = "realpass";
    expect(verifyCredentials("admin", "password")).toBe(false);
    expect(verifyCredentials("realuser", "realpass")).toBe(true);
  });
});
