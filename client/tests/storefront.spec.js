import { test, expect } from "./helpers.js";

test("search, category and cart updates persist across refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(2);
  await page.getByRole("textbox", { name: "Search products" }).fill("bottle");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(1);
  await page.getByRole("combobox", { name: "Filter by category" }).selectOption("Home");
  await expect(page.getByText("No products found")).toBeVisible();
  await page.getByRole("combobox", { name: "Filter by category" }).selectOption("All");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  const increase = page.getByRole("button", { name: "Increase quantity" });
  for (let count = 1; count < 20; count++) await increase.click();
  await expect(increase).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Cart (20)", exact: true }).click();
  await expect(increase).toBeDisabled();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("product request failure is visible instead of an empty catalogue", async ({ page }) => {
  await page.route("**/api/products", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Cannot reach the API");
  await expect(page.getByText("No products found")).toHaveCount(0);
});

test("unreadable API responses show an explicit error", async ({ page }) => {
  await page.route("**/api/products", (route) => route.fulfill({
    status: 200, contentType: "text/html", body: "<h1>Not JSON</h1>",
  }));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("The API returned an unreadable response");
});

test("saved cart validation keeps valid items and removing the last unit empties the cart", async ({ page, request }) => {
  const response = await request.get("http://127.0.0.1:5105/api/products");
  const { products } = await response.json();
  await page.addInitScript((productId) => {
    localStorage.setItem("shoplite_cart", JSON.stringify([
      null, { productId, quantity: 1 }, { productId, quantity: 21 },
    ]));
  }, products[0]._id);
  await page.goto("/");
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("unavailable browser storage produces a visible persistence warning", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Your cart could not be saved");
  await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Cart (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Your cart could not be saved");
});

test("search remains selected after a cart visit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Search products" }).fill("bottle");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Search products" })).toHaveValue("bottle");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(1);
});

test("request helper preserves string bodies, custom headers and empty successful responses", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/helper-check", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postData()).toBe('{"example":true}');
    expect(request.headers()["x-classroom"]).toBe("yes");
    expect(request.headers().authorization).toBe("Bearer test-session");
    await route.fulfill({ status: 204 });
  });
  const result = await page.evaluate(async () => {
    const { apiRequest } = await import("/src/api.js");
    return apiRequest("/api/helper-check", {
      method: "POST",
      token: "test-session",
      body: '{"example":true}',
      headers: { "X-Classroom": "yes" },
    });
  });
  expect(result).toBeNull();
});
