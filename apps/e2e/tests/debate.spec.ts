import { test, expect } from "@playwright/test";
import { registerViaApi, seedStorageState } from "../fixtures/users";

const EMAIL = "e2e-debate@brainstorm.test";
const PASSWORD = "haslo1234";

test.describe("Dyskusja - tworzenie i dodawanie argumentów", () => {
  test("utwórz dyskusję → dodaj argument Za → dodaj argument Przeciw", async ({
    page,
  }) => {
    // Seed użytkownika i wstrzyknij token (omijamy UI logowania)
    await page.goto("/");
    const { accessToken } = await registerViaApi(
      "Debater E2E",
      EMAIL,
      PASSWORD,
    );
    await seedStorageState(page, accessToken);

    // --- Tworzenie dyskusji ---
    await page.goto("/dyskusje/utworz");
    await page
      .getByLabel("Teza")
      .fill(
        "Praca zdalna na stałe zwiększa produktywność zespołów inżynieryjnych.",
      );
    // Domyślnie "Publiczna" jest zaznaczona
    await page.getByRole("button", { name: "Utwórz dyskusję" }).click();

    // Redirect na stronę dyskusji
    await page.waitForURL(/\/dyskusje\/.+/);
    // Poczekaj na węzły w grafie (teza)
    await expect(page.locator(".react-flow__node").first()).toBeVisible({
      timeout: 10_000,
    });

    // --- Argument Za ---
    await page
      .getByRole("button", { name: "Dodaj argument Za" })
      .first()
      .click();

    // Panel drawer identyfikowany przez role=dialog + aria-label (desktop aside)
    const panel = page.getByRole("dialog", { name: "Dodaj argument" });
    await expect(panel).toBeVisible({ timeout: 5_000 });
    await panel
      .getByRole("textbox")
      .fill(
        "Elastyczny czas pracy pozwala pracować w godzinach największej koncentracji.",
      );
    // Czekamy na submit; bez kluczy AI duplikat nie jest wykrywany i argument trafia od razu.
    await panel.getByRole("button", { name: "Dodaj argument Za" }).click();
    await expect(panel).not.toBeVisible({ timeout: 15_000 });

    // Graf: teza + 1 argument
    await expect(page.locator(".react-flow__node")).toHaveCount(2, {
      timeout: 10_000,
    });

    // --- Argument Przeciw ---
    await page
      .getByRole("button", { name: "Dodaj argument Przeciw" })
      .first()
      .click();

    const panel2 = page.getByRole("dialog", { name: "Dodaj argument" });
    await expect(panel2).toBeVisible({ timeout: 5_000 });
    await panel2
      .getByRole("textbox")
      .fill(
        "Brak bezpośredniego kontaktu z zespołem spowalnia rozwiązywanie złożonych problemów.",
      );
    await panel2
      .getByRole("button", { name: "Dodaj argument Przeciw" })
      .click();
    await expect(panel2).not.toBeVisible({ timeout: 15_000 });

    // Graf końcowy: teza + Za + Przeciw = 3 węzły
    await expect(page.locator(".react-flow__node")).toHaveCount(3, {
      timeout: 10_000,
    });
  });
});
