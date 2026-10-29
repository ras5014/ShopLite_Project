import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { startTestServer, register } from "./helpers.js";
import { User } from "../src/models/User.js";

let app;
before(async () => { app = await startTestServer(); });
after(async () => { if (app) await app.stop(); });

test("registration hashes passwords, normalizes email and supports later login", async () => {
  const session = await register(app.request, " STUDENT@example.com ");
  assert.equal(session.user.email, "student@example.com");
  assert.equal(session.user.passwordHash, undefined);
  assert.ok(session.token);
  const stored = await User.findOne({ email: session.user.email }).select("+passwordHash");
  assert.notEqual(stored.passwordHash, "classroom-test-password");
  assert.equal(await bcrypt.compare("classroom-test-password", stored.passwordHash), true);

  const login = await app.request("/api/auth/login", {
    method: "POST", body: { email: "STUDENT@example.com", password: "classroom-test-password" },
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.id, session.user.id);
  assert.equal(login.data.user.passwordHash, undefined);

  const wrong = await app.request("/api/auth/login", {
    method: "POST", body: { email: session.user.email, password: "wrong-password" },
  });
  const unknown = await app.request("/api/auth/login", {
    method: "POST", body: { email: "nobody@example.com", password: "wrong-password" },
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong, unknown);
  const duplicate = await app.request("/api/auth/register", {
    method: "POST", body: { name: "Student", email: session.user.email, password: "classroom-test-password" },
  });
  assert.equal(duplicate.status, 409);
});

test("invalid registration and missing or invalid tokens are rejected", async () => {
  for (const body of [
    { name: "", email: "a@example.com", password: "long-password" },
    { name: "A", email: "bad", password: "long-password" },
    { name: "A", email: "a@example.com", password: "short" },
  ]) {
    assert.equal((await app.request("/api/auth/register", { method: "POST", body })).status, 400);
  }
  assert.equal((await app.request("/api/orders")).status, 401);
  assert.equal((await app.request("/api/orders", { token: "invalid-token" })).status, 401);
});
