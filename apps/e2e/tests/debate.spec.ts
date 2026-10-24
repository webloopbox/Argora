import { test, expect } from "@playwright/test";
import { registerViaApi, seedStorageState } from "../fixtures/users";

const EMAIL = "e2e-debate@brainstorm.test";
const PASSWORD = "haslo1234";

test.describe("Dyskusja - tworzenie i dodawanie argumentów", () => {
  test("utwórz dyskusję → dodaj argument Za → dodaj argument Przeciw", async ({
    page,
  }) => {
    // Register through the API and inject the token, which skips the sign-in UI.
    await page.goto("/");
    const { accessToken } = await registerViaApi(
      "Debater E2E",
      EMAIL,
      PASSWORD,
    );
    await seedStorageState(page, accessToken);

    // --- Create the debate ---
    await page.goto("/dyskusje/utworz");
    await page
      .getByLabel("Teza")
      .fill(
        "Praca zdalna na stałe zwiększa produktywność zespołów inżynieryjnych.",
      );
    // "Publiczna" is selected by default.
    await page.getByRole("button", { name: "Utwórz dyskusję" }).click();

    // The form redirects to the debate page.
    await page.waitForURL(/\/dyskusje\/.+/);
    // Wait for the thesis node to render.
    await expect(page.locator(".react-flow__node").first()).toBeVisible({
      timeout: 10_000,
    });

    // --- For argument ---
    await page
      .getByRole("button", { name: "Dodaj argument Za" })
      .first()
      .click();

    // The drawer exposes role=dialog plus an aria-label, rendered as an <aside>
    // on desktop.
    const panel = page.getByRole("dialog", { name: "Dodaj argument" });
    await expect(panel).toBeVisible({ timeout: 5_000 });
    await panel
      .getByRole("textbox")
      .fill(
        "Elastyczny czas pracy pozwala pracować w godzinach największej koncentracji.",
      );
    // Without AI keys the duplicate check finds nothing, so the argument lands
    // on the first submit.
    await panel.getByRole("button", { name: "Dodaj argument Za" }).click();
    await expect(panel).not.toBeVisible({ timeout: 15_000 });

    // Graph holds the thesis plus one argument.
    await expect(page.locator(".react-flow__node")).toHaveCount(2, {
      timeout: 10_000,
    });

    // --- Against argument ---
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

    // Final graph: thesis, For and Against make three nodes.
    await expect(page.locator(".react-flow__node")).toHaveCount(3, {
      timeout: 10_000,
    });
  });
});
