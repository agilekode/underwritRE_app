import { test, expect } from '@playwright/test';

/**
 * End-to-end: Create a Mixed Use model (residential + retail), fill every step,
 * verify model details tabs.
 *
 * Mixed Use adds two extra steps vs Multifamily:
 *   - Retail Income (add tenants with lease terms)
 *   - Leasing Assumptions (residential + retail leasing costs)
 */

const MODEL_NAME_PREFIX = 'MU E2E Test';

// Use a completely fresh browser context — no saved auth state
test.use({ storageState: { cookies: [], origins: [] } });

test('Create Mixed Use model end-to-end', async ({ page }) => {
  test.setTimeout(240_000); // extra time for the longer Mixed Use flow

  const modelName = `${MODEL_NAME_PREFIX} ${Date.now()}`;

  // ──────────────────────────────────────────────
  // Mock: subscription check → active
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

  const loginBtn = page.getByRole('button', { name: /log in with email or google/i });
  if (await loginBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await loginBtn.click();
  }

  const emailInput = page
    .locator('input[type="email"], input[name="email" i], input[name="username" i], input[placeholder*="email" i]')
    .first();
  await expect(emailInput).toBeVisible({ timeout: 20_000 });
  await emailInput.fill(process.env.E2E_EMAIL ?? '');

  const continueAfterEmail = page.getByRole('button', { name: /continue|next|log in|sign in/i }).first();
  await continueAfterEmail.click();

  const passwordInput = page
    .locator('input[type="password"], input[name="password" i]')
    .first();
  await expect(passwordInput).toBeVisible({ timeout: 20_000 });
  await passwordInput.fill(process.env.E2E_PASSWORD ?? '');

  const continueAfterPassword = page.getByRole('button', { name: /continue|log in|sign in/i }).first();
  await continueAfterPassword.click();

  await expect(page.getByRole('button', { name: /your models/i })).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText(/\d+ deals?|no models found/i)
  ).toBeVisible({ timeout: 30_000 });

  // ──────────────────────────────────────────────
  // Step 1: Navigate to Create Model
  // ──────────────────────────────────────────────
  await page.getByRole('listitem').filter({ hasText: 'Create Model' }).getByRole('button').click();
  await page.waitForURL(/\/create-model/, { timeout: 15_000 });

  // ──────────────────────────────────────────────
  // Step 2: Select model type → Mixed Use
  // ──────────────────────────────────────────────
  const muRadio = page.getByRole('radio', { name: /mixed use/i });
  await expect(muRadio).toBeVisible({ timeout: 30_000 });
  await muRadio.check();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /get started/i }).click();

  // ──────────────────────────────────────────────
  // Step 3: Property Info
  // ──────────────────────────────────────────────
  await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
  await page.getByRole('textbox', { name: /address/i }).fill('456 Mixed Use Blvd');
  await page.getByRole('textbox', { name: /city/i }).fill('Brooklyn');
  await page.getByRole('textbox', { name: /state/i }).fill('NY');
  await page.getByRole('textbox', { name: /zip code/i }).fill('11201');
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 4: Acquisition / Pricing
  // ──────────────────────────────────────────────
  const askingPrice = page.getByRole('textbox', { name: /asking price/i });
  await askingPrice.dblclick();
  await askingPrice.fill('2500000');

  const acquisitionPrice = page.getByRole('textbox', { name: /acquisition price/i });
  await acquisitionPrice.dblclick();
  await acquisitionPrice.fill('2350000');

  await page.locator('input[type="date"]').fill('2026-03-01');

  const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
  await grossSf.click();
  await grossSf.fill('12000');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 5: Residential Unit Mix
  // ──────────────────────────────────────────────
  // Configure first unit row: 1BR, 800sf, $2,200/mo
  await page.getByRole('gridcell', { name: /studio/i }).getByRole('combobox').selectOption('1BR');
  await page.getByRole('gridcell', { name: 'sf' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'sf' }).getByRole('textbox').fill('800');
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').click();
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').fill('2200');

  // Duplicate 3 times for 4 units of same type
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Duplicate' }).click();
  }

  // Add a 2BR unit: 1100sf, $3,000/mo
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click();
  const lastRowLayout = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(3)');
  // Select 2BR layout if combobox exists
  const layoutCombo = lastRowLayout.getByRole('combobox');
  if (await layoutCombo.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await layoutCombo.selectOption('2BR');
  }
  const lastRowSf = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner');
  await lastRowSf.dblclick();
  await lastRowSf.fill('1100');
  await lastRowSf.press('Tab');
  const lastRowRent = page.locator('.MuiDataGrid-row--lastVisible > div:nth-child(5) > div > .no-spinner');
  await lastRowRent.fill('3000');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 6: Market Rent Assumptions
  // ──────────────────────────────────────────────
  const marketRentsDialog = page.locator('.MuiDialog-root');
  await expect(marketRentsDialog).toBeVisible({ timeout: 10_000 });

  // Fill market rents for each layout type
  const rentInputs = marketRentsDialog.locator('input[type="text"]');
  const rentCount = await rentInputs.count();
  for (let i = 0; i < rentCount; i++) {
    await rentInputs.nth(i).dblclick();
    await rentInputs.nth(i).fill(i === 0 ? '2400' : '3200'); // 1BR: $2,400, 2BR: $3,200
  }

  await page.locator('button:visible').filter({ hasText: 'Done' }).click();
  await expect(marketRentsDialog).toBeHidden({ timeout: 5_000 });

  // Proceed with defaults (Keep Tenant for all)
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 7: Retail Income (Mixed Use specific)
  // ──────────────────────────────────────────────
  // The retail income table starts empty — click "Add Retail Unit" for each tenant.
  // Columns: Suite (text), Tenant Name (text), Lease Start (number), Lease End (number),
  //          Square Ft (number), Rent Start Month (number), Annual Bumps (number),
  //          Rent PSF/Year (number), Rent Type (select), Annual Rent (calculated)
  // Use input[type="text"] to match all editable cells in order within a row.

  const addRetailBtn = page.getByRole('button', { name: /add retail unit/i });
  await expect(addRetailBtn).toBeVisible({ timeout: 10_000 });

  // ---- Tenant 1: Brooklyn Coffee Co ----
  await addRetailBtn.click();
  const row1 = page.locator('.MuiDataGrid-row').first();
  await expect(row1).toBeVisible({ timeout: 5_000 });
  const row1Inputs = row1.locator('input[type="text"]');
  // Suite
  await row1Inputs.nth(0).click();
  await row1Inputs.nth(0).fill('101');
  // Tenant Name
  await row1Inputs.nth(1).click();
  await row1Inputs.nth(1).fill('Brooklyn Coffee Co');
  // Lease Start Month
  await row1Inputs.nth(2).click();
  await row1Inputs.nth(2).fill('1');
  // Lease End Month
  await row1Inputs.nth(3).click();
  await row1Inputs.nth(3).fill('60');
  // Square Feet
  await row1Inputs.nth(4).click();
  await row1Inputs.nth(4).fill('1500');
  // Rent Start Month
  await row1Inputs.nth(5).click();
  await row1Inputs.nth(5).fill('2');
  // Annual Bumps (%)
  await row1Inputs.nth(6).click();
  await row1Inputs.nth(6).fill('2');
  // Rent PSF/Year
  await row1Inputs.nth(7).click();
  await row1Inputs.nth(7).fill('2.50');

  // ---- Tenant 2: Urban Boutique ----
  await addRetailBtn.click();
  const row2 = page.locator('.MuiDataGrid-row').nth(1);
  await expect(row2).toBeVisible({ timeout: 5_000 });
  const row2Inputs = row2.locator('input[type="text"]');
  await row2Inputs.nth(0).click();
  await row2Inputs.nth(0).fill('102');
  await row2Inputs.nth(1).click();
  await row2Inputs.nth(1).fill('Urban Boutique');
  await row2Inputs.nth(2).click();
  await row2Inputs.nth(2).fill('1');
  // Lease End Month
  await row2Inputs.nth(3).click();
  await row2Inputs.nth(3).fill('60');
  // Square Feet
  await row2Inputs.nth(4).click();
  await row2Inputs.nth(4).fill('1200');
  // Rent Start Month
  await row2Inputs.nth(5).click();
  await row2Inputs.nth(5).fill('3');
  // Annual Bumps (%)
  await row2Inputs.nth(6).click();
  await row2Inputs.nth(6).fill('2');
  // Rent PSF/Year
  await row2Inputs.nth(7).click();
  await row2Inputs.nth(7).fill('2.50');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 8: Amenity Income
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
  // Step 9: Operating Expenses
  // ──────────────────────────────────────────────
  // OperatingExpensesTable columns: Name (span), Cost per (select), Expense (.no-spinner input), Statistic (span), Monthly, Annual
  // Each row has exactly one .no-spinner input — the expense amount.
  const opExpenseRows = [
    { name: /property taxes/i, value: '150' },
    { name: /insurance/i, value: '120' },
    { name: /water.*sewer/i, value: '80' },
    { name: /repairs.*maintenance/i, value: '100' },
    { name: /trash/i, value: '1200' },
    { name: /super.*payroll/i, value: '200' },
    { name: /heat.*gas/i, value: '150' },
    { name: /common area electric/i, value: '0.50' },
    { name: /landscaping/i, value: '1200' },
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

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 10: Net Operating Income (skip / continue)
  // ──────────────────────────────────────────────
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 11: Acquisition Financing
  // ──────────────────────────────────────────────
  await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).dblclick();
  await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).fill('6.5');

  await page.getByRole('textbox', { name: /acquisition loan amortization/i }).dblclick();
  await page.getByRole('textbox', { name: /acquisition loan amortization/i }).fill('30');

  await page.getByRole('textbox', { name: /loan-to-value/i }).dblclick();
  await page.getByRole('textbox', { name: /loan-to-value/i }).fill('70');

  await page.getByRole('textbox', { name: /minimum dscr/i }).dblclick();
  await page.getByRole('textbox', { name: /minimum dscr/i }).fill('1.25');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 12: Leasing Assumptions (Mixed Use specific)
  // ──────────────────────────────────────────────
  // This step has residential leasing params + retail leasing cost reserves
  // Fill fields if visible — field names come from LeasingAssumptions + LeasingCostReserves components

  // Residential leasing assumptions
  const rehabTime = page.getByRole('textbox', { name: /rehab time/i });
  if (await rehabTime.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await rehabTime.dblclick();
    await rehabTime.fill('2');
  }

  const leaseUpTime = page.getByRole('textbox', { name: /lease.?up time/i });
  if (await leaseUpTime.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await leaseUpTime.dblclick();
    await leaseUpTime.fill('1');
  }

  const vacancy = page.getByRole('textbox', { name: /vacancy/i });
  if (await vacancy.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await vacancy.dblclick();
    await vacancy.fill('5');
  }

  const annualTurnover = page.getByRole('textbox', { name: /annual turnover/i });
  if (await annualTurnover.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await annualTurnover.dblclick();
    await annualTurnover.fill('20');
  }

  const brokerFee = page.getByRole('textbox', { name: /broker fee/i });
  if (await brokerFee.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await brokerFee.dblclick();
    await brokerFee.fill('1');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 13: Refinancing Options
  // ──────────────────────────────────────────────
  // Change "Model a refinancing?" from No → Yes
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Yes' }).click();

  await page.getByRole('textbox', { name: /enter month number/i }).dblclick();
  await page.getByRole('textbox', { name: /enter month number/i }).fill('36');

  const fixedRate = page.getByRole('textbox', { name: /fixed interest rate/i });
  if (await fixedRate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await fixedRate.dblclick();
    await fixedRate.fill('5.25');
  }

  const amortInput = page.getByRole('textbox', { name: /amortization/i });
  if (await amortInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await amortInput.dblclick();
    await amortInput.fill('30');
  }

  const origCost = page.getByRole('textbox', { name: /origination cost/i });
  if (await origCost.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await origCost.dblclick();
    await origCost.fill('1');
  }

  const capRate = page.getByRole('spinbutton', { name: /applied cap rate/i });
  if (await capRate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await capRate.dblclick();
    await capRate.fill('6');
  }

  const ltvMax = page.getByRole('spinbutton', { name: /ltv max/i });
  if (await ltvMax.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await ltvMax.dblclick();
    await ltvMax.fill('70');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 14: Closing Costs
  // ──────────────────────────────────────────────
  const closingCostRows = [
    { name: /acquisition fee/i, value: '0.5' },
    { name: /financing fees.*acquisition/i, value: '0.25' },
    { name: /title insurance/i, value: '0.15' },
    { name: /appraisal/i, value: '3500' },
    { name: /inspection/i, value: '2500' },
  ];
  for (const cc of closingCostRows) {
    const row = page.getByRole('row', { name: cc.name });
    await row.getByRole('textbox').dblclick();
    await row.getByRole('textbox').fill(cc.value);
  }

  // Attorney fees
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('5000');

  // Transfer taxes / recording by position
  await page.locator('div:nth-child(7) > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('div:nth-child(7) > div:nth-child(4) > div > .no-spinner').fill('95');
  await page.locator('div:nth-child(8) > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('div:nth-child(8) > div:nth-child(4) > div > .no-spinner').fill('30');
  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').fill('1');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 15: Legal & Pre-Development Costs
  // ──────────────────────────────────────────────
  await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').fill('500');

  await page.getByRole('row', { name: /environmental testing/i }).getByRole('combobox').selectOption('per Unit');
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('200');
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').fill('5');

  await page.getByRole('row', { name: /lender.*legal.*financing/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /lender.*legal.*financing/i }).getByRole('textbox').fill('3000');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('2500');

  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('0.15');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 16: Reserves
  // ──────────────────────────────────────────────
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').fill('15');
  await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').press('Tab');
  await page.getByRole('gridcell', { name: 'months' }).getByRole('textbox').fill('6');

  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').first().dblclick();
  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').first().fill('2');
  await page.getByRole('gridcell', { name: /sf 0/ }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: /sf 0/ }).getByRole('textbox').fill('8000');

  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / sf' }).getByRole('textbox').fill('0.5');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('1000');

  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('2');

  await page.locator('div:nth-child(4) > div:nth-child(5) > div > .no-spinner').dblclick();
  await page.locator('div:nth-child(4) > div:nth-child(5) > div > .no-spinner').fill('1');

  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').dblclick();
  await page.locator('.u-row-odd.MuiDataGrid-row--lastVisible > div:nth-child(4) > div > .no-spinner').fill('0.5');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 17: Hard Costs
  // ──────────────────────────────────────────────
  await page.getByRole('row', { name: /demo/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /demo/i }).getByRole('textbox').fill('1000');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('2000');

  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('5');

  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').fill('5');

  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('0.5');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 18: Exit / Hold Period
  // ──────────────────────────────────────────────
  await page.getByRole('textbox').first().dblclick();
  await page.getByRole('textbox').first().fill('5');

  await page.getByRole('textbox').nth(1).dblclick();
  await page.getByRole('textbox').nth(1).fill('76');

  await page.getByRole('textbox').nth(2).dblclick();
  await page.getByRole('textbox').nth(2).fill('4.5');

  await page.getByRole('button', { name: /finish/i }).click();

  // ──────────────────────────────────────────────
  // Step 19: Verify Model Details page loads
  // ──────────────────────────────────────────────
  await expect(page).toHaveURL(/\/models\//, { timeout: 60_000 });
  await expect(page.getByText(modelName)).toBeVisible({ timeout: 10_000 });

  // ──────────────────────────────────────────────
  // Step 20: Verify all tabs are accessible
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
