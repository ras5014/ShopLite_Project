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
