import type { Page } from '@playwright/test';

/** Skips the password, which has its own test. */
export async function unlock(page: Page) {
  await page.addInitScript(() => localStorage.setItem('ranemon.unlocked', '1'));
}
