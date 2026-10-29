import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { startTestServer, register } from "./helpers.js";
import { Product } from "../src/models/Product.js";

let app;
before(async () => { app = await startTestServer(); });
after(async () => { if (app) await app.stop(); });

test("checkout calculates trusted totals, merges quantities and preserves private history", async () => {
  const alice = await register(app.request, "alice@example.com");
  const bob = await register(app.request, "bob@example.com");
  const [bottle, lamp] = app.products;
  const placed = await app.request("/api/orders", {
    method: "POST", token: alice.token,
    body: {
      user: bob.user.id, totalAmount: 1,
      items: [
        { productId: bottle.id, quantity: 1, price: 1 },
        { productId: bottle.id, quantity: 1 },
        { productId: lamp.id, quantity: 1 },
      ],
    },
  });
  assert.equal(placed.status, 201);
  assert.equal(placed.data.order.totalAmount, 3097);
  assert.equal(placed.data.order.user, alice.user.id);
  assert.equal(placed.data.order.status, "placed");
  assert.equal(placed.data.order.items.length, 2);
  assert.equal(placed.data.order.items[0].quantity, 2);

  await Product.updateOne({ _id: bottle.id }, { $set: { name: "New bottle name", price: 1 } });
  const history = await app.request("/api/orders", { token: alice.token });
  assert.equal(history.data.orders[0].items[0].name, "Insulated Bottle");
  assert.equal(history.data.orders[0].items[0].price, 799);
  assert.equal(history.data.orders[0].totalAmount, 3097);
  assert.deepEqual((await app.request("/api/orders", { token: bob.token })).data.orders, []);
  assert.equal((await app.request("/api/orders", { method: "POST", body: { items: [] } })).status, 401);
  const expired = jwt.sign({ sub: alice.user.id }, app.secret, { expiresIn: -1 });
  assert.equal((await app.request("/api/orders", { token: expired })).status, 401);
});

test("checkout rejects bad IDs, unavailable products and invalid or excessive quantities", async () => {
  const session = await register(app.request, "validation@example.com");
  const bottleId = app.products[0].id;
  const invalidCarts = [
    [], [null], [{ productId: "invalid", quantity: 1 }],
    [{ productId: "000000000000000000000001", quantity: 1 }],
    [{ productId: app.products[2].id, quantity: 1 }],
    ...[0, -1, 21, 1.5, "2"].map((quantity) => [{ productId: bottleId, quantity }]),
    [{ productId: bottleId, quantity: 11 }, { productId: bottleId, quantity: 10 }],
    Array.from({ length: 51 }, () => ({ productId: bottleId, quantity: 1 })),
  ];
  for (const items of invalidCarts) {
    const result = await app.request("/api/orders", { method: "POST", token: session.token, body: { items } });
    assert.equal(result.status, 400, JSON.stringify(items));
    assert.equal(typeof result.data.message, "string");
  }
  assert.deepEqual((await app.request("/api/orders", { token: session.token })).data.orders, []);
});

test("mixed-case ObjectIds refer to the same product and share the quantity limit", async () => {
  const session = await register(app.request, "id-case@example.com");
  const productId = app.products[1].id;
  const body = { items: [
    { productId: productId.toUpperCase(), quantity: 10 },
    { productId, quantity: 10 },
  ] };
  const valid = await app.request("/api/orders", { method: "POST", token: session.token, body });
  assert.equal(valid.status, 201);
  assert.equal(valid.data.order.items.length, 1);
  assert.equal(valid.data.order.items[0].quantity, 20);
  assert.equal(valid.data.order.totalAmount, 29980);
  body.items[0].quantity = 11;
  const invalid = await app.request("/api/orders", { method: "POST", token: session.token, body });
  assert.equal(invalid.status, 400);
  assert.equal((await app.request("/api/orders", { token: session.token })).data.orders.length, 1);
});
