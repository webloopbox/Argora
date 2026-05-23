import type { Page } from '@playwright/test';

const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'brainstorm.token';

export interface SeedUser {
  accessToken: string;
  user: { id: string; displayName: string; email: string };
}

export async function registerViaApi(
  displayName: string,
  email: string,
  password: string,
): Promise<SeedUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Register failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<SeedUser>;
}

export async function loginViaApi(email: string, password: string): Promise<SeedUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<SeedUser>;
}

/** Injects the token into the page's localStorage so subsequent navigations are authenticated. */
export async function seedStorageState(page: Page, accessToken: string): Promise<void> {
  await page.evaluate(
    ([key, token]) => window.localStorage.setItem(key, token),
    [TOKEN_KEY, accessToken],
  );
}

/** Clears the token from localStorage (simulates sign-out in storage terms). */
export async function clearStorageState(page: Page): Promise<void> {
  await page.evaluate((key) => window.localStorage.removeItem(key), TOKEN_KEY);
}
