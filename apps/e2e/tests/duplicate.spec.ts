import { test, expect } from '@playwright/test';
import { registerViaApi, seedStorageState } from '../fixtures/users';
import { createDebateApi, createArgumentApi } from '../fixtures/api-helpers';

const EMAIL = 'e2e-dup@brainstorm.test';
const PASSWORD = 'haslo1234';

const ORIGINAL_CONTENT = 'Praca zdalna zwiększa satysfakcję pracowników i redukuje rotację.';
const DUPLICATE_CONTENT = 'Praca zdalna poprawia zadowolenie i zmniejsza odejścia z pracy.';

test.describe('Duplikat — dialog scalania', () => {
  test('identyczny argument → dialog merge → Połącz', async ({ page }) => {
    // Seed danych przez API
    const { accessToken } = await registerViaApi('Dup Tester', EMAIL, PASSWORD);
    const debate = await createDebateApi(accessToken, {
      thesis: 'Praca zdalna to przyszłość.',
      visibility: 'public',
    });
    const original = await createArgumentApi(accessToken, debate.id, {
      content: ORIGINAL_CONTENT,
      side: 'pro',
    });

    // Zaloguj przez localStorage
    await page.goto('/');
    await seedStorageState(page, accessToken);

    // Podmień endpoint check-duplicate przez route interception — uniezależnia
    // test od dostępności kluczy API do modeli językowych.
    await page.route('**/ai/arguments/check-duplicate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ duplicateOf: original }),
      });
    });

    // Przejdź na stronę dyskusji
    await page.goto(`/dyskusje/${debate.id}`);
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10_000 });

    // Graf: teza + 1 argument
    await expect(page.locator('.react-flow__node')).toHaveCount(2, { timeout: 8_000 });

    // Dodaj argument Za z treścią "duplikatu"
    await page.getByRole('button', { name: 'Dodaj argument Za' }).first().click();

    const panel = page.getByRole('dialog', { name: 'Dodaj argument' });
    await expect(panel).toBeVisible({ timeout: 5_000 });
    await panel.getByRole('textbox').fill(DUPLICATE_CONTENT);
    await panel.getByRole('button', { name: 'Dodaj argument Za' }).click();

    // Dialog merge identyfikowany przez aria-labelledby="merge-dialog-title"
    const mergeDialog = page.getByRole('dialog', { name: 'Podobny argument już istnieje' });
    await expect(mergeDialog).toBeVisible({ timeout: 10_000 });

    // Kliknij "Połącz (dodaj głos)"
    await mergeDialog.getByRole('button', { name: 'Połącz (dodaj głos)' }).click();
    await expect(mergeDialog).not.toBeVisible({ timeout: 8_000 });

    // Graf nadal ma 2 węzły (teza + original argument, brak nowego)
    await expect(page.locator('.react-flow__node')).toHaveCount(2, { timeout: 8_000 });
  });
});
