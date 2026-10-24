import { test, expect } from "@playwright/test";

const DISPLAY_NAME = "E2E Tester";
const EMAIL = "e2e-auth@brainstorm.test";
const PASSWORD = "haslo1234";

test.describe("Auth - rejestracja i logowanie", () => {
  test("rejestracja → wylogowanie → logowanie", async ({ page }) => {
    // --- Sign-up ---
    await page.goto("/rejestracja");

    await page.getByLabel("Nazwa wyświetlana").fill(DISPLAY_NAME);
    await page.getByLabel("Adres e-mail").fill(EMAIL);
    await page.getByLabel("Hasło").fill(PASSWORD);
    // Scoped to <form> to match the sign-in step below, where TopBar carries a
    // second button of the same name.
    await page
      .locator("form")
      .getByRole("button", { name: "Załóż konto" })
      .click();

    // Sign-up redirects to the dashboard.
    await page.waitForURL(/\/$/);
    await expect(page.getByRole("banner")).toContainText(DISPLAY_NAME);

    // --- Sign-out ---
    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(
      page.getByRole("button", { name: "Zaloguj się" }).first(),
    ).toBeVisible();

    // --- Sign-in ---
    await page.goto("/logowanie");
    await page.getByLabel("Adres e-mail").fill(EMAIL);
    await page.getByLabel("Hasło").fill(PASSWORD);
    // Scoped to <form>: while signed out, TopBar shows a second "Zaloguj się" button.
    await page
      .locator("form")
      .getByRole("button", { name: "Zaloguj się" })
      .click();

    await page.waitForURL(/\/$/);
    await expect(page.getByRole("banner")).toContainText(DISPLAY_NAME);
  });
});
