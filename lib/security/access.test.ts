import assert from "node:assert/strict";
import test from "node:test";
import { authorizeRequest, type AccessConfiguration } from "./access";

const request = (authorization?: string) => new Request("https://coqui.example/api/generate", {
  headers: authorization ? { authorization } : undefined,
});

test("open mode allows local and public demo requests", () => {
  assert.equal(authorizeRequest(request(), { mode: "open" }), null);
});

test("misconfigured live production fails closed", () => {
  const response = authorizeRequest(request(), { mode: "misconfigured" });
  assert.equal(response?.status, 503);
});

test("protected mode challenges missing or invalid credentials", () => {
  const config: AccessConfiguration = { mode: "protected", username: "bryan", password: "secret" };
  const missing = authorizeRequest(request(), config);
  const invalid = authorizeRequest(request(`Basic ${Buffer.from("bryan:wrong").toString("base64")}`), config);

  assert.equal(missing?.status, 401);
  assert.equal(missing?.headers.get("www-authenticate"), 'Basic realm="Coquí", charset="UTF-8"');
  assert.equal(invalid?.status, 401);
});

test("protected mode accepts exact credentials", () => {
  const config: AccessConfiguration = { mode: "protected", username: "bryan", password: "secret" };
  const authorization = `Basic ${Buffer.from("bryan:secret").toString("base64")}`;
  assert.equal(authorizeRequest(request(authorization), config), null);
});
