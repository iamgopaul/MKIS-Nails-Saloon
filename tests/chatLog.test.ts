import { describe, it, expect, beforeEach } from "vitest";
import { hashIp } from "@/lib/chatLog";

describe("chat log helpers", () => {
  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-salt";
  });

  it("hashes IPs deterministically with the same salt", () => {
    const a = hashIp("10.0.0.1");
    const b = hashIp("10.0.0.1");
    expect(a).toBe(b);
  });

  it("produces different hashes for different IPs", () => {
    expect(hashIp("10.0.0.1")).not.toBe(hashIp("10.0.0.2"));
  });

  it("returns a 32-char hex string", () => {
    expect(hashIp("1.2.3.4")).toMatch(/^[0-9a-f]{32}$/);
  });
});
