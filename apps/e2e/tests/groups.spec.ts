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
    // Register both users through the API.
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

    // --- User A creates the group ---
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

    // The app either redirects to the group or renders it in place.
    await page.waitForURL(/\/grupy\/.+/, { timeout: 10_000 });
    const groupUrl = page.url();
    const groupId = groupUrl.split("/grupy/")[1]!;

    // --- User A invites User B through the directory search ---
    const searchInput = page.getByPlaceholder(/Szukaj po nazwie/);
    await searchInput.fill(USER_B.displayName.slice(0, 8));

    // The picker renders each result as a <button> rather than role=option, and
    // the accessible name carries displayName plus email, so match on displayName.
    const option = page.getByRole("button", {
      name: new RegExp(USER_B.displayName),
    });
    await expect(option).toBeVisible({ timeout: 8_000 });
    await option.click();

    await page.getByRole("button", { name: "Wyślij zaproszenie" }).click();

    // The invitation shows up under "Wysłane zaproszenia".
    await expect(page.getByText("Oczekuje")).toBeVisible({ timeout: 8_000 });

    // --- User B accepts the invitation ---
    await clearStorageState(page);
    await seedStorageState(page, tokenB);
    await page.goto("/zaproszenia");

    await expect(page.getByText("Zaproszenie do grupy")).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("button", { name: "Przyjmij" }).click();

    // Accepting redirects to the group page.
    await page.waitForURL(/\/grupy\/.+/, { timeout: 10_000 });

    // --- User A confirms that B now holds a membership ---
    await clearStorageState(page);
    await seedStorageState(page, tokenA);
    await page.goto(`/grupy/${groupId}`);

    // The members list is a <section aria-label="Członkowie">, which exposes role=region.
    const membersSection = page.getByRole("region", { name: "Członkowie" });
    await expect(membersSection).toContainText(USER_B.displayName, {
      timeout: 8_000,
    });
  });
});
