import assert from "node:assert/strict";
import test from "node:test";
import { enforceRateLimit } from "./rate-limit";

test("rate limiter allows the configured burst and then returns 429", () => {
  const request = new Request("https://coqui.example/api/generate", {
    headers: { "x-forwarded-for": `test-${crypto.randomUUID()}` },
  });
  const policy = { name: `test-${crypto.randomUUID()}`, limit: 2, windowMs: 60_000 };

  assert.equal(enforceRateLimit(request, policy), null);
  assert.equal(enforceRateLimit(request, policy), null);
  const blocked = enforceRateLimit(request, policy);
  assert.equal(blocked?.status, 429);
  assert.equal(blocked?.headers.get("retry-after"), "60");
});
