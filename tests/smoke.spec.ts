import { test, expect } from '@playwright/test';

test('app loads and shows landing page', async ({ page }) => {
  await page.goto('/');

  // Change this to something stable you expect on the page:
  // a header, product name, or a known button.
  await expect(page.getByRole('heading')).toBeVisible();
});
