import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";
import { Product } from "../src/models/Product.js";

let app;
before(async () => { app = await startTestServer(); });
after(async () => { if (app) await app.stop(); });

test("catalogue returns active products in name order and reflects database updates", async () => {
  const first = await app.request("/api/products");
  assert.equal(first.status, 200);
  assert.deepEqual(first.data.products.map((product) => product.name), ["Desk Lamp", "Insulated Bottle"]);

  await Product.updateOne({ slug: "bottle" }, { $set: { price: 899 } });
  const second = await app.request("/api/products");
  assert.equal(second.data.products.find((product) => product.slug === "bottle").price, 899);
  assert.equal((await app.request("/api/orders")).status, 401);
  assert.equal((await app.request("/api/not-a-route")).status, 404);
});

test("seeding updates matching slugs without duplicating the eight demo products", async () => {
  await app.seed();
  assert.equal(await Product.countDocuments(), 11);
  await Product.updateOne({ slug: "insulated-bottle" }, { $set: { price: 1 } });
  await app.seed();
  assert.equal(await Product.countDocuments(), 11);
  const result = await app.request("/api/products");
  assert.equal(result.data.products.length, 10);
  assert.equal(result.data.products.find((product) => product.slug === "insulated-bottle").price, 799);
});
