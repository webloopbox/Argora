import { test, expect } from "@playwright/test";
import { registerViaApi, seedStorageState } from "../fixtures/users";
import { createDebateApi, createArgumentApi } from "../fixtures/api-helpers";

const EMAIL = "e2e-dup@brainstorm.test";
const PASSWORD = "haslo1234";

const ORIGINAL_CONTENT =
  "Praca zdalna zwiększa satysfakcję pracowników i redukuje rotację.";
const DUPLICATE_CONTENT =
  "Praca zdalna poprawia zadowolenie i zmniejsza odejścia z pracy.";

test.describe("Duplikat - dialog scalania", () => {
  test("identyczny argument → dialog merge → Połącz", async ({ page }) => {
    // Seed the debate and the first argument through the API.
    const { accessToken } = await registerViaApi("Dup Tester", EMAIL, PASSWORD);
    const debate = await createDebateApi(accessToken, {
      thesis: "Praca zdalna to przyszłość.",
      visibility: "public",
    });
    const original = await createArgumentApi(accessToken, debate.id, {
      content: ORIGINAL_CONTENT,
      side: "pro",
    });

    // Sign in by writing the token into localStorage.
    await page.goto("/");
    await seedStorageState(page, accessToken);

    // Stub check-duplicate through route interception so the test runs without
    // credentials for any language model.
    await page.route("**/ai/arguments/check-duplicate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ duplicateOf: original }),
      });
    });

    // Open the debate page.
    await page.goto(`/dyskusje/${debate.id}`);
    await expect(page.locator(".react-flow__node").first()).toBeVisible({
      timeout: 10_000,
    });

    // Graph holds the thesis plus one argument.
    await expect(page.locator(".react-flow__node")).toHaveCount(2, {
      timeout: 8_000,
    });

    // Submit a For argument that repeats the stored one.
    await page
      .getByRole("button", { name: "Dodaj argument Za" })
      .first()
      .click();

    const panel = page.getByRole("dialog", { name: "Dodaj argument" });
    await expect(panel).toBeVisible({ timeout: 5_000 });
    await panel.getByRole("textbox").fill(DUPLICATE_CONTENT);
    await panel.getByRole("button", { name: "Dodaj argument Za" }).click();

    // The merge dialog is addressed through aria-labelledby="merge-dialog-title".
    const mergeDialog = page.getByRole("dialog", {
      name: "Podobny argument już istnieje",
    });
    await expect(mergeDialog).toBeVisible({ timeout: 10_000 });

    // Choose merge, which casts a vote on the stored argument.
    await mergeDialog
      .getByRole("button", { name: "Połącz (dodaj głos)" })
      .click();
    await expect(mergeDialog).not.toBeVisible({ timeout: 8_000 });

    // The graph still holds two nodes: merging adds a vote, never a node.
    await expect(page.locator(".react-flow__node")).toHaveCount(2, {
      timeout: 8_000,
    });
  });
});
