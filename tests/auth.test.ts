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
