import { describe, it, expect } from "vitest";
import { generateManageToken, manageTokenExpiry } from "@/lib/manageToken";

describe("manage tokens", () => {
  it("generates URL-safe 43-char tokens", () => {
    const t = generateManageToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, generateManageToken));
    expect(tokens.size).toBe(100);
  });

  it("expiry is after the appointment date", () => {
    const expires = manageTokenExpiry("2026-06-15");
    const apptEnd = new Date("2026-06-15T23:59:59");
    expect(expires.getTime()).toBeGreaterThan(apptEnd.getTime());
  });
});
