import { test, expect, signUp } from "./helpers.js";

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
