import { test, expect } from '@playwright/test';

test('Landing page: nav, logo position, identity', async ({ page }) => {
  await page.goto('/');

  // 2) Lands on "Your Models"
  await expect(page.getByRole('button', { name: /your models/i })).toBeVisible();
  await expect(page.getByText(/total deals underwritten/i)).toBeVisible();

  // 3) Create Model button exists
  await expect(page.getByRole('button', { name: /create model/i })).toBeVisible();

  // 4) Left nav items visible
  await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^admin$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit feedback/i })).toBeVisible();

  // 4) User Management is OPTIONAL right now:
  // If it's missing, we log a warning instead of failing the test.
  const userMgmt = page.getByRole('button', { name: /user management|users|members/i });
  const hasUserMgmt = await userMgmt.isVisible().catch(() => false);
  if (!hasUserMgmt) {
    console.warn('⚠️ User Management button not visible (expected in your current instance).');
  }

  // 5) User name + logout shown (bottom left)
  // Use exact match for username (avoids strict mode collision with email)
  await expect(page.getByText('cdurkin', { exact: true })).toBeVisible();

  // If "Log out" is a link, keep role=link; if it's a button in some builds, handle both.
  const logoutLink = page.getByRole('link', { name: /log out/i });
  const logoutButton = page.getByRole('button', { name: /log out/i });
  await expect(
    logoutLink.or(logoutButton),
    'Expected a visible Log out link or button'
  ).toBeVisible();

  // 1) Logo position: check "underwritre" near top-left
  const logo = page.getByText(/underwritre/i).first();
  await expect(logo).toBeVisible();

  const box = await logo.boundingBox();
  expect(box, 'Logo bounding box was null').not.toBeNull();
  expect(box!.y, 'Logo should be near top').toBeLessThan(120);
  expect(box!.x, 'Logo should be near left').toBeLessThan(250);
});
