import { test, expect, signUp } from "./helpers.js";
import { randomUUID } from "node:crypto";

test("registration persists session; logout and login handle incorrect credentials", async ({ page }) => {
  await page.goto("/");
  const email = await signUp(page);
  await page.reload();
  await expect(page.getByText("Hi, Student")).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await expect(page.getByText("Hi, Student")).toBeVisible();
});

test("React Hook Form validates fields before sending registration", async ({ page }) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/auth/register")) submissions++;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Name is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Email is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Password is required.", { exact: true })).toBeVisible();
  await expect(page.locator('input[aria-invalid="true"]:focus')).toHaveCount(1);
  await page.getByLabel("Full name").fill("   ");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("A valid email is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Password must be at least 8 characters.", { exact: true })).toBeVisible();
  expect(submissions).toBe(0);

  await page.getByLabel("Full name").fill("Student");
  await page.getByLabel("Email").fill(`${randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Hi, Student")).toBeVisible();
  expect(submissions).toBe(1);
});

test("switching to login clears registration errors and excludes the unmounted name field", async ({ page }) => {
  let sentBody;
  await page.route("**/api/auth/login", async (route) => {
    sentBody = route.request().postDataJSON();
    await route.fulfill({
      status: 401, contentType: "application/json",
      body: JSON.stringify({ message: "Email or password is incorrect." }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Name is required.", { exact: true })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
  expect(sentBody).toEqual({ email: "student@example.com", password: "classroom-test-password" });
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("pending auth mutation disables submit and mode switch without retrying failures", async ({ page }) => {
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  let submissions = 0;
  await page.route("**/api/auth/login", async (route) => {
    submissions++;
    await ready;
    await route.fulfill({
      status: 401, contentType: "application/json",
      body: JSON.stringify({ message: "Email or password is incorrect." }),
    });
  });
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.getByLabel("Email").fill("student@example.com");
    await page.getByLabel("Password").fill("classroom-test-password");
    await page.getByRole("button", { name: "Log in", exact: true }).last().click();
    await expect(page.getByRole("button", { name: "Please wait…" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Create an account", exact: true })).toBeDisabled();
    release();
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    await expect(page.getByRole("button", { name: "Log in", exact: true }).last()).toBeEnabled();
    expect(submissions).toBe(1);
  } finally {
    release();
  }
});
