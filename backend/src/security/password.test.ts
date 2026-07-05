import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(
      true,
    );
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(await verifyPassword("wrong-pass", hash)).toBe(false);
  });

  it("produces unique salts for identical passwords", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same", a)).toBe(true);
    expect(await verifyPassword("same", b)).toBe(true);
  });

  it("does not throw on malformed stored hashes", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
