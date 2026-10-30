import { test, expect, signUp } from "./helpers.js";

test("checkout requires login, saves a trusted order and isolates another user's history", async ({ page }) => {
  await page.goto("/");
  const bottle = page.locator("article").filter({ has: page.getByRole("heading", { name: "Insulated Bottle" }) });
  await bottle.getByRole("button", { name: "Add to cart", exact: true }).click();
  await bottle.getByRole("button", { name: "Add to cart", exact: true }).click();
  const lamp = page.locator("article").filter({ has: page.getByRole("heading", { name: "Desk Lamp" }) });
  await lamp.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart (3)", exact: true }).click();
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await signUp(page);
  await page.getByRole("button", { name: "Cart (3)", exact: true }).click();
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/orders") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const { order } = await response.json();
  expect(order.totalAmount).toBe(3097);
  await expect(page.getByText(order._id, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cart (0)", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByText(order._id, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await signUp(page);
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByText("No orders yet")).toBeVisible();
  await expect(page.getByText(order._id, { exact: true })).toHaveCount(0);
});

test("failed checkout keeps the cart and shows the API error", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.route("**/api/orders", (route) => route.fulfill({
    status: 400, contentType: "application/json",
    body: JSON.stringify({ message: "One or more products are unavailable." }),
  }));
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("One or more products are unavailable.");
  await expect(page.getByRole("button", { name: "Cart (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Place demo order", exact: true })).toBeEnabled();
});

test("checkout invalidates already cached order history and displays both receipts", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByText("No orders yet")).toBeVisible();

  const orderIds = [];
  for (let count = 1; count <= 2; count++) {
    await page.getByRole("button", { name: "Shop", exact: true }).click();
    await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
    await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
    const placed = page.waitForResponse((response) =>
      response.url().endsWith("/api/orders") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Place demo order", exact: true }).click();
    const { order } = await (await placed).json();
    orderIds.push(order._id);
    await expect(page.locator(".order-card")).toHaveCount(count);
    for (const id of orderIds) {
      await expect(page.getByText(id, { exact: true })).toBeVisible();
    }
  }
});

test("an expired session error hides cached orders when history is revisited", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await page.route("**/api/orders", (route) => route.fulfill({
    status: 401, contentType: "application/json",
    body: JSON.stringify({ message: "Invalid or expired token." }),
  }));
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid or expired token.");
  await expect(page.locator(".order-card")).toHaveCount(0);
});

test("logout cancels a pending private query before another account loads history", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  let requested = false;
  let cancelled = false;
  page.on("requestfailed", (request) => {
    if (request.url().endsWith("/api/orders")) cancelled = true;
  });
  await page.route("**/api/orders", async (route) => {
    requested = true;
    await ready;
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"orders":[]}' });
  });
  try {
    await page.getByRole("button", { name: "My orders", exact: true }).click();
    await expect.poll(() => requested).toBe(true);
    await expect(page.getByText("Loading your orders…")).toBeVisible();
    cancelled = false;
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect.poll(() => cancelled).toBe(true);
    release();
    await page.unroute("**/api/orders");
    await signUp(page);
    await page.getByRole("button", { name: "My orders", exact: true }).click();
    await expect(page.getByText("No orders yet")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  } finally {
    release();
  }
});

test("a late checkout response cannot clear a different account's cart", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  let saved = false;
  await page.route("**/api/orders", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    saved = true;
    await ready;
    await route.fulfill({ response });
  });
  try {
    await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
    await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
    await page.getByRole("button", { name: "Place demo order", exact: true }).click();
    await expect.poll(() => saved).toBe(true);
    await expect(page.getByRole("button", { name: "Placing order…" })).toBeDisabled();
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await signUp(page);
    await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
    await page.getByRole("button", { name: "Cart (2)", exact: true }).click();
    release();
    await expect(page.getByRole("button", { name: "Place demo order", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Cart (2)", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shopping cart", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "My orders", exact: true }).click();
    await expect(page.getByText("No orders yet")).toBeVisible();
  } finally {
    release();
  }
});
