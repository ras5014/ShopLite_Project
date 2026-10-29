import { randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("https://**", (route) => route.abort());
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(errors).toEqual([]);
  },
});
export { expect };

export async function signUp(page) {
  const email = `${randomUUID()}@example.com`;
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByLabel("Full name").fill("Student");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Hi, Student")).toBeVisible();
  return email;
}
