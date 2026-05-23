import { test, expect } from "@playwright/test";
import {
  registerViaApi,
  seedStorageState,
  clearStorageState,
} from "../fixtures/users";

const USER_A = {
  displayName: "Właściciel Grupy",
  email: "e2e-owner@brainstorm.test",
  password: "haslo1234",
};
const USER_B = {
  displayName: "Zaproszony Gość",
  email: "e2e-guest@brainstorm.test",
  password: "haslo1234",
};

test.describe("Grupy - zaproszenia i członkostwo", () => {
  test("Utwórz grupę → zaproś → przyjmij → weryfikuj członkostwo", async ({
    page,
  }) => {
    // Seed obu użytkowników
    const { accessToken: tokenA } = await registerViaApi(
      USER_A.displayName,
      USER_A.email,
      USER_A.password,
    );
    const { accessToken: tokenB } = await registerViaApi(
      USER_B.displayName,
      USER_B.email,
      USER_B.password,
    );

    // --- Jako User A: utwórz grupę ---
    await page.goto("/");
    await seedStorageState(page, tokenA);
    await page.goto("/grupy");
    await expect(
      page.getByRole("heading", { name: "Grupy prywatne" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Utwórz grupę" }).click();

    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.getByRole("textbox").fill("Grupa E2E Test");
    await createDialog.getByRole("button", { name: "Utwórz grupę" }).click();
    await expect(createDialog).not.toBeVisible({ timeout: 8_000 });

    // Redirect lub wyświetlenie grupy
    await page.waitForURL(/\/grupy\/.+/, { timeout: 10_000 });
    const groupUrl = page.url();
    const groupId = groupUrl.split("/grupy/")[1]!;

    // --- Jako User A: zaproś User B przez wyszukiwarkę ---
    const searchInput = page.getByPlaceholder(/Szukaj po nazwie/);
    await searchInput.fill(USER_B.displayName.slice(0, 8));

    // Picker renderuje wyniki jako <button>, nie role=option. Nazwa przycisku
    // zawiera displayName + email; regex po displayName wystarczy.
    const option = page.getByRole("button", {
      name: new RegExp(USER_B.displayName),
    });
    await expect(option).toBeVisible({ timeout: 8_000 });
    await option.click();

    await page.getByRole("button", { name: "Wyślij zaproszenie" }).click();

    // Zaproszenie powinno pojawić się na liście "Wysłane zaproszenia"
    await expect(page.getByText("Oczekuje")).toBeVisible({ timeout: 8_000 });

    // --- Jako User B: przyjmij zaproszenie ---
    await clearStorageState(page);
    await seedStorageState(page, tokenB);
    await page.goto("/zaproszenia");

    await expect(page.getByText("Zaproszenie do grupy")).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("button", { name: "Przyjmij" }).click();

    // Po przyjęciu redirect na stronę grupy
    await page.waitForURL(/\/grupy\/.+/, { timeout: 10_000 });

    // --- Jako User A: zweryfikuj że B jest członkiem ---
    await clearStorageState(page);
    await seedStorageState(page, tokenA);
    await page.goto(`/grupy/${groupId}`);

    // Sekcja Członkowie jest <section aria-label="Członkowie"> → role=region
    const membersSection = page.getByRole("region", { name: "Członkowie" });
    await expect(membersSection).toContainText(USER_B.displayName, {
      timeout: 8_000,
    });
  });
});
