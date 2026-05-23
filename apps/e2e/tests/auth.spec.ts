import { test, expect } from "@playwright/test";

const DISPLAY_NAME = "E2E Tester";
const EMAIL = "e2e-auth@brainstorm.test";
const PASSWORD = "haslo1234";

test.describe("Auth - rejestracja i logowanie", () => {
  test("rejestracja → wylogowanie → logowanie", async ({ page }) => {
    // --- Rejestracja ---
    await page.goto("/rejestracja");

    await page.getByLabel("Nazwa wyświetlana").fill(DISPLAY_NAME);
    await page.getByLabel("Adres e-mail").fill(EMAIL);
    await page.getByLabel("Hasło").fill(PASSWORD);
    // Submit registracji - scope do <form>, bo TopBar też ma button "Załóż konto"? Nie, ale dla spójności.
    await page
      .locator("form")
      .getByRole("button", { name: "Załóż konto" })
      .click();

    // Po rejestracji redirect na dashboard
    await page.waitForURL(/\/$/);
    await expect(page.getByRole("banner")).toContainText(DISPLAY_NAME);

    // --- Wylogowanie ---
    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(
      page.getByRole("button", { name: "Zaloguj się" }).first(),
    ).toBeVisible();

    // --- Logowanie ---
    await page.goto("/logowanie");
    await page.getByLabel("Adres e-mail").fill(EMAIL);
    await page.getByLabel("Hasło").fill(PASSWORD);
    // Scope do <form>, bo TopBar też ma button "Zaloguj się" (użytkownik wylogowany)
    await page
      .locator("form")
      .getByRole("button", { name: "Zaloguj się" })
      .click();

    await page.waitForURL(/\/$/);
    await expect(page.getByRole("banner")).toContainText(DISPLAY_NAME);
  });
});
