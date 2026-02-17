import { test, expect } from '@playwright/test';

/**
 * End-to-end: Create a Multifamily model, fill every step, verify model details tabs.
 *
 * Handles its own Auth0 login to get a live token (storageState alone
 * doesn't preserve Auth0 domain session cookies needed by getAccessTokenSilently).
 * The model name includes a timestamp so parallel runs don't collide.
 */

const MODEL_NAME_PREFIX = 'MF E2E Test';

// Use a completely fresh browser context — no saved auth state
test.use({ storageState: { cookies: [], origins: [] } });

test('Create Multifamily model end-to-end', async ({ page }) => {
  test.setTimeout(180_000); // generous timeout for full flow

  const modelName = `${MODEL_NAME_PREFIX} ${Date.now()}`;

  // ──────────────────────────────────────────────
  // Mock: subscription check → active
  // Auth0's iframe-based token refresh doesn't work reliably in Playwright's
  // browser context, so the subscription API call often fails. We mock it so
  // the test can focus on the create-model flow.
  // ──────────────────────────────────────────────
  await page.route('**/api/billing/subscription', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'active', eligible_for_trial: false }),
    });
  });

  // ──────────────────────────────────────────────
  // Step 0: Log in via Auth0
  // ──────────────────────────────────────────────
  await page.goto('/');

  // Click the login button
  const loginBtn = page.getByRole('button', { name: /log in with email or google/i });
  if (await loginBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await loginBtn.click();
  }

  // Enter email
  const emailInput = page
    .locator('input[type="email"], input[name="email" i], input[name="username" i], input[placeholder*="email" i]')
    .first();
  await expect(emailInput).toBeVisible({ timeout: 20_000 });
  await emailInput.fill(process.env.E2E_EMAIL ?? '');

  const continueAfterEmail = page.getByRole('button', { name: /continue|next|log in|sign in/i }).first();
  await continueAfterEmail.click();

  // Enter password
  const passwordInput = page
    .locator('input[type="password"], input[name="password" i]')
    .first();
  await expect(passwordInput).toBeVisible({ timeout: 20_000 });
  await passwordInput.fill(process.env.E2E_PASSWORD ?? '');

  const continueAfterPassword = page.getByRole('button', { name: /continue|log in|sign in/i }).first();
  await continueAfterPassword.click();

  // Wait for authenticated home page
  await expect(page.getByRole('button', { name: /your models/i })).toBeVisible({ timeout: 30_000 });

  // Wait for subscription check to complete and page to settle
  await expect(
    page.getByText(/\d+ deals?|no models found/i)
  ).toBeVisible({ timeout: 30_000 });

  // ──────────────────────────────────────────────
  // Step 1: Navigate to Create Model
  // ──────────────────────────────────────────────
  // Use the sidebar nav button (not the main page CTA)
  await page.getByRole('listitem').filter({ hasText: 'Create Model' }).getByRole('button').click();
  await page.waitForURL(/\/create-model/, { timeout: 15_000 });

  // ──────────────────────────────────────────────
  // Step 2: Select model type → Multifamily
  // ──────────────────────────────────────────────
  // Wait for model types to load from the API
  const mfRadio = page.getByRole('radio', { name: 'Multifamily', exact: true });
  await expect(mfRadio).toBeVisible({ timeout: 30_000 });
  await mfRadio.check();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /get started/i }).click();

  // ──────────────────────────────────────────────
  // Step 3: Property Info
  // ──────────────────────────────────────────────
  await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
  await page.getByRole('textbox', { name: /address/i }).fill('123 Test Address');
  await page.getByRole('textbox', { name: /city/i }).fill('New York');
  await page.getByRole('textbox', { name: /state/i }).fill('NY');
  await page.getByRole('textbox', { name: /zip code/i }).fill('10001');
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 4: Acquisition / Pricing
  // ──────────────────────────────────────────────
  const askingPrice = page.getByRole('textbox', { name: /asking price/i });
  await askingPrice.dblclick();
  await askingPrice.fill('1000000');

  const acquisitionPrice = page.getByRole('textbox', { name: /acquisition price/i });
  await acquisitionPrice.dblclick();
  await acquisitionPrice.fill('950000');

  await page.locator('input[type="date"]').fill('2026-02-15');

  const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
  await grossSf.click();
  await grossSf.fill('5000');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 5: Unit Mix
  // ──────────────────────────────────────────────
  // Configure first unit row
  await page.getByRole('gridcell', { name: /studio/i }).getByRole('combobox').selectOption('1BR');
  await page.getByRole('gridcell', { name: 'sf' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'sf' }).getByRole('textbox').fill('1000');
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').click();
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').fill('2000');

  // Duplicate 5 times for total of 6 units of same type
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'Duplicate' }).click();
  }

  // Add one more unit (different type)
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click();
  const lastRowSf = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner');
  await lastRowSf.dblclick();
  await lastRowSf.fill('750');
  await lastRowSf.press('Tab');
  const lastRowRent = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(5) > div > .no-spinner');
  await lastRowRent.fill('1750');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 6: Rental Assumptions (loss-to-lease, vacancy, concessions, etc.)
  // ──────────────────────────────────────────────
  // Market Rents dialog appears automatically — fill rents and dismiss
  // MUI Dialog uses role="presentation", so locate by text content
  const marketRentsDialog = page.locator('.MuiDialog-root');
  await expect(marketRentsDialog).toBeVisible({ timeout: 10_000 });

  // Fill Studio market rent (first input) and 1BR market rent (second input)
  const rentInputs = marketRentsDialog.locator('input[type="text"]');
  await rentInputs.nth(0).dblclick();
  await rentInputs.nth(0).fill('2000');
  await rentInputs.nth(1).dblclick();
  await rentInputs.nth(1).fill('2500');

  // Dismiss the dialog — click the visible "Done" button
  await page.locator('button:visible').filter({ hasText: 'Done' }).click();
  await expect(marketRentsDialog).toBeHidden({ timeout: 5_000 });

  // Market rent assumptions are set — proceed with defaults (Keep Tenant for all)
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 7: Other Income
  // ──────────────────────────────────────────────
  await page.getByRole('textbox').first().dblclick();
  await page.getByRole('textbox').first().fill('1');
  await page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox').fill('5');
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('100');
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('15');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 8: Operating Expenses
  // ──────────────────────────────────────────────
  // OperatingExpensesTable columns: Name (span), Cost per (select), Expense (.no-spinner input), Statistic (span), Monthly, Annual
  // Each row has exactly one .no-spinner input — the expense amount.
  const opExpenseRows = [
    { name: /property taxes/i, value: '100' },
    { name: /insurance/i, value: '100' },
    { name: /water.*sewer/i, value: '100' },
    { name: /repairs.*maintenance/i, value: '100' },
    { name: /trash/i, value: '1000' },
    { name: /super.*payroll/i, value: '100' },
    { name: /heat.*gas/i, value: '100' },
    { name: /common area electric/i, value: '1' },
    { name: /landscaping/i, value: '1000' },
    { name: /property management/i, value: '3' },
    { name: /reserves/i, value: '2' },
  ];
  for (const exp of opExpenseRows) {
    const row = page.getByRole('row', { name: exp.name });
    const input = row.locator('.no-spinner').first();
    await input.dblclick();
    await input.fill(exp.value);
    await input.press('Tab');
  }

  // Add a custom expense
  await page.getByRole('combobox', { name: /add or select expense/i }).click();
  await page.getByRole('option', { name: /bank fees/i }).click();
  const newExpenseCell = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner');
  await newExpenseCell.dblclick();
  await newExpenseCell.fill('100');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 9: Capital Improvements (skip / continue)
  // ──────────────────────────────────────────────
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 10: Acquisition Financing
  // ──────────────────────────────────────────────
  await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).dblclick();
  await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).fill('6');

  await page.getByRole('textbox', { name: /acquisition loan amortization/i }).dblclick();
  await page.getByRole('textbox', { name: /acquisition loan amortization/i }).fill('31');

  await page.getByRole('textbox', { name: /loan-to-value/i }).dblclick();
  await page.getByRole('textbox', { name: /loan-to-value/i }).fill('72');

  // Enable hard cost financing
  await page.getByText(/no.*do not finance hard costs/i).click();
  await page.getByRole('option', { name: /yes.*finance hard costs/i }).click();

  await page.getByRole('textbox', { name: /ltc on hard costs/i }).dblclick();
  await page.getByRole('textbox', { name: /ltc on hard costs/i }).fill('75');

  await page.getByRole('textbox', { name: /minimum dscr/i }).dblclick();
  await page.getByRole('textbox', { name: /minimum dscr/i }).fill('1.25');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 11: Disposition / Exit Assumptions (skip / continue)
  // ──────────────────────────────────────────────
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 12: Refinancing Options
  // ──────────────────────────────────────────────
  // Change "Model a refinancing?" from No → Yes
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Yes' }).click();

  // Fill refinancing month
  await page.getByRole('textbox', { name: /enter month number/i }).dblclick();
  await page.getByRole('textbox', { name: /enter month number/i }).fill('32');

  // Fill refinancing details (fields appear after selecting Yes)
  const fixedRate = page.getByRole('textbox', { name: /fixed interest rate/i });
  if (await fixedRate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await fixedRate.dblclick();
    await fixedRate.fill('5.5');
  }

  const amortInput = page.getByRole('textbox', { name: /amortization/i });
  if (await amortInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await amortInput.dblclick();
    await amortInput.fill('32');
  }

  const origCost = page.getByRole('textbox', { name: /origination cost/i });
  if (await origCost.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await origCost.dblclick();
    await origCost.fill('1.25');
  }

  const capRate = page.getByRole('spinbutton', { name: /applied cap rate/i });
  if (await capRate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await capRate.dblclick();
    await capRate.fill('6.5');
  }

  const ltvMax = page.getByRole('spinbutton', { name: /ltv max/i });
  if (await ltvMax.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await ltvMax.dblclick();
    await ltvMax.fill('72');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 13: Closing Costs
  // ──────────────────────────────────────────────
  const closingCostRows = [
    { name: /acquisition fee/i, value: '0.1' },
    { name: /financing fees.*acquisition/i, value: '0.1' },
    { name: /title insurance/i, value: '0.1' },
    { name: /appraisal/i, value: '1000' },
    { name: /inspection/i, value: '1000' },
  ];
  for (const cc of closingCostRows) {
    const row = page.getByRole('row', { name: cc.name });
    await row.getByRole('textbox').dblclick();
    await row.getByRole('textbox').fill(cc.value);
  }

  // Attorney fees
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('1000');

  // Transfer taxes / recording / misc by position
  await page.locator('div:nth-child(7) > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('div:nth-child(7) > div:nth-child(4) > div > .no-spinner').fill('95');
  await page.locator('div:nth-child(8) > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('div:nth-child(8) > div:nth-child(4) > div > .no-spinner').fill('30');
  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').fill('1');

  // Add a custom closing cost
  await page.getByRole('combobox', { name: /add or select closing cost/i }).click();
  await page.getByRole('option', { name: /application fee/i }).click();
  const newCcCell = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner');
  await newCcCell.click();
  await newCcCell.fill('500');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 14: Legal & Pre-Development Costs
  // ──────────────────────────────────────────────
  await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').fill('100');

  // Environmental testing - change to per unit
  await page.getByRole('row', { name: /environmental testing/i }).getByRole('combobox').selectOption('per Unit');
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('100');
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').fill('5');

  await page.getByRole('row', { name: /lender.*legal.*financing/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /lender.*legal.*financing/i }).getByRole('textbox').fill('1000');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('1000');

  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('0.1');

  // Add custom legal cost
  await page.getByRole('combobox', { name: /add or select legal/i }).click();
  await page.getByRole('option', { name: /c\/o fees.*permits/i }).click();
  const newLegalCell = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner');
  await newLegalCell.dblclick();
  await newLegalCell.fill('100');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 15: Reserves
  // ──────────────────────────────────────────────
  // Interest reserve
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').fill('10');
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').press('Tab');
  await page.getByRole('gridcell', { name: 'months' }).getByRole('textbox').fill('5');

  // Renovation reserve
  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').first().dblclick();
  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').first().fill('1');
  await page.getByRole('gridcell', { name: /sf 0/ }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: /sf 0/ }).getByRole('textbox').fill('5000');

  // Operating reserve
  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').fill('0.5');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('500');

  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('1');

  await page.locator('div:nth-child(4) > div:nth-child(5) > div > .no-spinner').dblclick();
  await page.locator('div:nth-child(4) > div:nth-child(5) > div > .no-spinner').fill('1');

  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').fill('0.5');

  // Add custom reserve
  await page.getByRole('combobox', { name: /add or select reserve/i }).click();
  await page.getByRole('option', { name: /cash.*keys/i }).click();
  const newReserveCell = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner');
  await newReserveCell.dblclick();
  await newReserveCell.fill('500');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 16: Hard Costs
  // ──────────────────────────────────────────────
  await page.getByRole('row', { name: /demo/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /demo/i }).getByRole('textbox').fill('500');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('500');

  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('1');

  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').fill('5');

  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('0.5');

  // Add custom hard cost
  await page.getByRole('combobox', { name: /add or select hard cost/i }).click();
  await page.getByRole('option', { name: /green card repairs/i }).click();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('500');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 17: Exit / Hold Period
  // ──────────────────────────────────────────────
  await page.getByRole('textbox').first().dblclick();
  await page.getByRole('textbox').first().fill('5');

  await page.getByRole('textbox').nth(1).dblclick();
  await page.getByRole('textbox').nth(1).fill('76');

  await page.getByRole('textbox').nth(2).dblclick();
  await page.getByRole('textbox').nth(2).fill('4');

  await page.getByRole('button', { name: /finish/i }).click();

  // ──────────────────────────────────────────────
  // Step 18: Verify Model Details page loads
  // ──────────────────────────────────────────────
  await expect(page).toHaveURL(/\/models\//, { timeout: 60_000 });

  // Verify model name appears on the details page
  await expect(page.getByText(modelName)).toBeVisible({ timeout: 10_000 });

  // ──────────────────────────────────────────────
  // Step 19: Verify all tabs are accessible
  // ──────────────────────────────────────────────
  const tabs = [
    'Income and Expenses',
    'Annual NOI',
    'Annual Cash Flow',
    'Exit Summary',
    'Exit Valuation and Returns',
    'Notes & Pictures',
  ];

  for (const tabName of tabs) {
    const tab = page.getByRole('tab', { name: tabName });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
});
