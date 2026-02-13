// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const storageStatePath = path.join(__dirname, '..', '.auth', 'state.json');

setup('authenticate', async ({ page }) => {
  // Fail on runtime errors
  page.on('pageerror', (error) => {
    throw new Error(`❌ Page runtime error: ${error.message}`);
  });

  // Fail on console errors
  page.on('console', (msg) => {
  if (msg.type() !== 'error') return;

  const text = msg.text();

  // Ignore common non-blocking noise (favicon, sourcemaps, etc.)
  const ignorePatterns = [
    /Failed to load resource.*404/i,
    /favicon\.ico/i,
    /net::ERR_FAILED/i,
    /Source map error/i,
  ];

  if (ignorePatterns.some((re) => re.test(text))) return;

  throw new Error(`❌ Console error detected: ${text}`);
});


  await page.goto('/');

  // Fail if dev error overlay is present
  const devErrorOverlay = page.getByText(/compiled with problems|error occurred|failed to compile/i);
  if (await devErrorOverlay.isVisible().catch(() => false)) {
    throw new Error('❌ Dev error overlay detected. Fix compile/runtime errors before running Playwright tests.');
  }

  const yourModelsNav = page.getByRole('button', { name: /your models/i });

  // Case 1: already logged in
  if (await yourModelsNav.isVisible().catch(() => false)) {
    await page.context().storageState({ path: storageStatePath });
    return;
  }

  // ---- Step A: Click the first login button (your screenshot) ----
  const startLoginBtn = page.getByRole('button', { name: /log in with email or google/i });
  if (await startLoginBtn.isVisible().catch(() => false)) {
    await startLoginBtn.click();
  }

  // ---- Step B: Email screen ----
  // Auth providers often use: input[type=email], input[name="email"], input[name="username"]
  const emailInput = page
    .locator('input[type="email"], input[name="email" i], input[name="username" i], input[placeholder*="email" i]')
    .first();

  await expect(emailInput, 'Could not find email input on auth screen').toBeVisible({ timeout: 20000 });
  await emailInput.fill(process.env.E2E_EMAIL ?? '');

  // Button text varies: Continue / Next / Log in
  const continueAfterEmail = page.getByRole('button', { name: /continue|next|log in|sign in/i }).first();
  await expect(continueAfterEmail, 'Could not find Continue/Next after entering email').toBeVisible({ timeout: 20000 });
  await continueAfterEmail.click();

  // ---- Step C: Password screen ----
  const passwordInput = page
    .locator('input[type="password"], input[name="password" i], input[placeholder*="password" i]')
    .first();

  await expect(passwordInput, 'Could not find password input on auth screen').toBeVisible({ timeout: 20000 });
  await passwordInput.fill(process.env.E2E_PASSWORD ?? '');

  const continueAfterPassword = page.getByRole('button', { name: /continue|log in|sign in/i }).first();
  await expect(continueAfterPassword, 'Could not find Log in/Continue after entering password').toBeVisible({
    timeout: 20000,
  });
  await continueAfterPassword.click();

  // Confirm authenticated landing page
  await expect(yourModelsNav).toBeVisible({ timeout: 30000 });

  // Save auth state
  await page.context().storageState({ path: storageStatePath });
});
