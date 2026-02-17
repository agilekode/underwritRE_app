import { test, expect } from '@playwright/test';

/**
 * End-to-end: Create an Industrial model, fill every step, verify model details tabs.
 *
 * Industrial flow (16 steps, no residential units):
 *   1. Property Address
 *   2. General Property Assumptions
 *   3. Base Income          (RetailIncomeTable + Lease End & Rent Type columns)
 *   4. Recoverable Operating Expenses (RetailExpensesIndustrial)
 *   5. Recovery and Gross Potential Income
 *   6. Leasing Cost Reserves
 *   7. Income Summary       (read-only)
 *   8. Amenity Income
 *   9. Net Operating Income  (read-only)
 *  10. Acquisition Financing
 *  11. Refinancing
 *  12. Closing Costs
 *  13. Legal and Pre-Development Costs
 *  14. Reserves
 *  15. Hard Costs
 *  16. Exit Assumptions
 */

const MODEL_NAME_PREFIX = 'IND E2E Test';

// Fresh browser context — no saved auth state
test.use({ storageState: { cookies: [], origins: [] } });

test('Create Industrial model end-to-end', async ({ page }) => {
  test.setTimeout(240_000);

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
  // Step 2: Select model type → Industrial
  // ──────────────────────────────────────────────
  const indRadio = page.getByRole('radio', { name: /industrial/i });
  await expect(indRadio).toBeVisible({ timeout: 30_000 });
  await indRadio.check();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /get started/i }).click();

  // ──────────────────────────────────────────────
  // Step 3: Property Address
  // ──────────────────────────────────────────────
  await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
  await page.getByRole('textbox', { name: /address/i }).fill('200 Industrial Pkwy');
  await page.getByRole('textbox', { name: /city/i }).fill('Newark');
  await page.getByRole('textbox', { name: /state/i }).fill('NJ');
  await page.getByRole('textbox', { name: /zip code/i }).fill('07114');
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 4: General Property Assumptions (Acquisition / Pricing)
  // ──────────────────────────────────────────────
  // Fields come from the backend; fill what's visible.
  const askingPrice = page.getByRole('textbox', { name: /asking price/i });
  await askingPrice.dblclick();
  await askingPrice.fill('5500000');

  const acquisitionPrice = page.getByRole('textbox', { name: /acquisition price/i });
  await acquisitionPrice.dblclick();
  await acquisitionPrice.fill('5200000');

  // Close date
  const dateInput = page.locator('input[type="date"]');
  if (await dateInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await dateInput.fill('2026-04-01');
  }

  const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
  if (await grossSf.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await grossSf.click();
    await grossSf.fill('45000');
  }

  // Year Built (required for Industrial)
  const yearBuilt = page.getByRole('textbox', { name: /year built/i });
  if (await yearBuilt.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await yearBuilt.click();
    await yearBuilt.fill('1998');
  }

  // Lot Size (Acre)
  const lotSize = page.getByRole('textbox', { name: /acre/i });
  if (await lotSize.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await lotSize.dblclick();
    await lotSize.fill('2.5');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 5: Base Income (Industrial — RetailIncomeTable w/ Industrial columns)
  // ──────────────────────────────────────────────
  // Industrial columns add Lease End Month (input index 3) and Rent Type (MUI Select).
  // Input order per row: Suite(0), Tenant Name(1), Lease Start(2), Lease End(3),
  //                       Square Ft(4), Rent Start Month(5), Annual Bumps(6), Rent PSF/Year(7)
  // Then: Rent Type (Select, not input), Annual Rent (read-only)

  const addRetailBtn = page.getByRole('button', { name: /add retail unit/i });
  await expect(addRetailBtn).toBeVisible({ timeout: 10_000 });

  // ---- Tenant 1: Logistics warehouse (NNN lease) ----
  await addRetailBtn.click();
  const row1 = page.locator('.MuiDataGrid-row').first();
  await expect(row1).toBeVisible({ timeout: 5_000 });
  const row1Inputs = row1.locator('input[type="text"]');
  await row1Inputs.nth(0).click(); await row1Inputs.nth(0).fill('A-1');         // Suite
  await row1Inputs.nth(1).click(); await row1Inputs.nth(1).fill('FastFreight Logistics');  // Tenant Name
  await row1Inputs.nth(2).click(); await row1Inputs.nth(2).fill('1');           // Lease Start Month
  await row1Inputs.nth(3).click(); await row1Inputs.nth(3).fill('120');         // Lease End Month (10-yr)
  await row1Inputs.nth(4).click(); await row1Inputs.nth(4).fill('25000');       // Square Feet
  await row1Inputs.nth(5).click(); await row1Inputs.nth(5).fill('1');           // Rent Start Month
  await row1Inputs.nth(6).click(); await row1Inputs.nth(6).fill('2.5');         // Annual Bumps (%)
  await row1Inputs.nth(7).click(); await row1Inputs.nth(7).fill('12');          // Rent PSF/Year ($12)

  // Set Rent Type to NNN via MUI Select dropdown
  const row1RentTypeSelect = row1.locator('.MuiSelect-select').first();
  if (await row1RentTypeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await row1RentTypeSelect.click();
    await page.getByRole('option', { name: 'NNN' }).click();
  }

  // ---- Tenant 2: Cold storage facility (Gross lease) ----
  await addRetailBtn.click();
  const row2 = page.locator('.MuiDataGrid-row').nth(1);
  await expect(row2).toBeVisible({ timeout: 5_000 });
  const row2Inputs = row2.locator('input[type="text"]');
  await row2Inputs.nth(0).click(); await row2Inputs.nth(0).fill('B-1');         // Suite
  await row2Inputs.nth(1).click(); await row2Inputs.nth(1).fill('ColdChain Storage');     // Tenant Name
  await row2Inputs.nth(2).click(); await row2Inputs.nth(2).fill('1');           // Lease Start Month
  await row2Inputs.nth(3).click(); await row2Inputs.nth(3).fill('60');          // Lease End Month (5-yr)
  await row2Inputs.nth(4).click(); await row2Inputs.nth(4).fill('15000');       // Square Feet
  await row2Inputs.nth(5).click(); await row2Inputs.nth(5).fill('1');           // Rent Start Month
  await row2Inputs.nth(6).click(); await row2Inputs.nth(6).fill('3');           // Annual Bumps (%)
  await row2Inputs.nth(7).click(); await row2Inputs.nth(7).fill('18');          // Rent PSF/Year ($18)

  // Rent Type stays Gross (default)

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 6: Recoverable Operating Expenses
  // ──────────────────────────────────────────────
  // Pre-populated rows: CAM, Management Fee, Insurance, Property Taxes, Misc.
  // Each row has: Name (text input), Factor (Select), Expense (NumberDecimalInput), Statistic (read-only),
  //               Rent Type Included (Select), Annual (read-only), Delete
  // Fill expense amounts for the pre-populated rows using the expense input (NumberDecimalInput / .no-spinner)
  const expenseGrid = page.locator('.MuiDataGrid-root').first();
  await expect(expenseGrid).toBeVisible({ timeout: 10_000 });

  // Fill expense values for each pre-populated row
  // Row order: CAM, Management Fee, Insurance, Property Taxes, Misc.
  const expenseRows = expenseGrid.locator('.MuiDataGrid-row');
  const expenseCount = await expenseRows.count();

  // CAM: $3.50/SF/Yr → change factor to "per SF / Yr." then set $3.50
  // The default factor varies; fill the expense cost input for each row.
  const expenseValues = ['8500', '4', '2.25', '35000', '2500'];
  for (let i = 0; i < Math.min(expenseCount, expenseValues.length); i++) {
    const row = expenseRows.nth(i);
    // Find the NumberDecimalInputCell (cost_per field — has .no-spinner class)
    const costInput = row.locator('.no-spinner').first();
    if (await costInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await costInput.click();
      await costInput.fill(expenseValues[i]);
    }
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 7: Recovery and Gross Potential Income
  // ──────────────────────────────────────────────
  // Recovery Income table: editable Recovery Start Month per tenant
  // Gross Potential table: editable Vacancy %

  // Set Recovery Start Month for each tenant
  const recoveryGrid = page.locator('.MuiDataGrid-root').first();
  await expect(recoveryGrid).toBeVisible({ timeout: 10_000 });

  const recoveryRows = recoveryGrid.locator('.MuiDataGrid-row');
  const recoveryCount = await recoveryRows.count();
  for (let i = 0; i < recoveryCount; i++) {
    const monthInput = recoveryRows.nth(i).locator('.no-spinner').first();
    if (await monthInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await monthInput.click();
      await monthInput.fill('1'); // Recoveries start month 1
    }
  }

  // Set Vacancy % in Gross Potential Retail Income section
  // It uses a PercentInput (MUI TextField with % suffix)
  const vacancyInput = page.getByRole('textbox', { name: /vacancy/i });
  if (await vacancyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await vacancyInput.dblclick();
    await vacancyInput.fill('5');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 8: Leasing Cost Reserves
  // ──────────────────────────────────────────────
  // Two-column layout with New Lease / Renewal Lease inputs
  // Fields: Renewal Probability, Avg Rent, TI's, Commissions, Term

  // Lease Renewal Probability (Renewal Lease column)
  const renewalProb = page.getByRole('textbox', { name: /renewal property.*renewal lease/i });
  if (await renewalProb.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await renewalProb.dblclick();
    await renewalProb.fill('65');
  }

  // Average Retail Rent — New Lease
  const rentNew = page.getByRole('textbox', { name: /retail rent.*new lease/i });
  if (await rentNew.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await rentNew.dblclick();
    await rentNew.fill('14');
  }

  // Average Retail Rent — Renewal Lease
  const rentRenewal = page.getByRole('textbox', { name: /retail rent.*renewal lease/i });
  if (await rentRenewal.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await rentRenewal.dblclick();
    await rentRenewal.fill('15');
  }

  // Tenant Improvements — New Lease
  const tiNew = page.getByRole('textbox', { name: /ti.*new lease/i });
  if (await tiNew.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await tiNew.dblclick();
    await tiNew.fill('8');
  }

  // Tenant Improvements — Renewal Lease
  const tiRenewal = page.getByRole('textbox', { name: /ti.*renewal lease/i });
  if (await tiRenewal.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await tiRenewal.dblclick();
    await tiRenewal.fill('3');
  }

  // Leasing Commissions — New Lease
  const commNew = page.getByRole('textbox', { name: /leasing commissions.*new lease/i });
  if (await commNew.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await commNew.dblclick();
    await commNew.fill('6');
  }

  // Leasing Commissions — Renewal Lease
  const commRenewal = page.getByRole('textbox', { name: /leasing commissions.*renewal lease/i });
  if (await commRenewal.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await commRenewal.dblclick();
    await commRenewal.fill('3');
  }

  // Lease Term — New Lease
  const termNew = page.getByRole('textbox', { name: /lease term.*new lease/i });
  if (await termNew.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await termNew.dblclick();
    await termNew.fill('7');
  }

  // Lease Term — Renewal Lease
  const termRenewal = page.getByRole('textbox', { name: /lease term.*renewal lease/i });
  if (await termRenewal.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await termRenewal.dblclick();
    await termRenewal.fill('5');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 9: Income Summary (read-only — just continue)
  // ──────────────────────────────────────────────
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 10: Amenity Income
  // ──────────────────────────────────────────────
  // Fill a simple amenity — loading dock income
  await page.getByRole('textbox').first().dblclick();
  await page.getByRole('textbox').first().fill('1');
  await page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox').fill('3');
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('100');
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('250');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 11: Net Operating Income (read-only — just continue)
  // ──────────────────────────────────────────────
  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 12: Acquisition Financing
  // ──────────────────────────────────────────────
  await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).dblclick();
  await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).fill('6.75');

  await page.getByRole('textbox', { name: /acquisition loan amortization/i }).dblclick();
  await page.getByRole('textbox', { name: /acquisition loan amortization/i }).fill('25');

  await page.getByRole('textbox', { name: /loan-to-value/i }).dblclick();
  await page.getByRole('textbox', { name: /loan-to-value/i }).fill('65');

  await page.getByRole('textbox', { name: /minimum dscr/i }).dblclick();
  await page.getByRole('textbox', { name: /minimum dscr/i }).fill('1.30');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 13: Refinancing Options
  // ──────────────────────────────────────────────
  // Change "Model a refinancing?" from No → Yes
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Yes' }).click();

  await page.getByRole('textbox', { name: /enter month number/i }).dblclick();
  await page.getByRole('textbox', { name: /enter month number/i }).fill('60');

  const fixedRate = page.getByRole('textbox', { name: /fixed interest rate/i });
  if (await fixedRate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await fixedRate.dblclick();
    await fixedRate.fill('5.75');
  }

  const amortInput = page.getByRole('textbox', { name: /amortization/i });
  if (await amortInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await amortInput.dblclick();
    await amortInput.fill('25');
  }

  const origCost = page.getByRole('textbox', { name: /origination cost/i });
  if (await origCost.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await origCost.dblclick();
    await origCost.fill('1');
  }

  const capRate = page.getByRole('spinbutton', { name: /applied cap rate/i });
  if (await capRate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await capRate.dblclick();
    await capRate.fill('7');
  }

  const ltvMax = page.getByRole('spinbutton', { name: /ltv max/i });
  if (await ltvMax.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await ltvMax.dblclick();
    await ltvMax.fill('65');
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 14: Closing Costs
  // ──────────────────────────────────────────────
  const closingCostRows = [
    { name: /acquisition fee/i, value: '0.5' },
    { name: /financing fees.*acquisition/i, value: '0.25' },
    { name: /title insurance/i, value: '0.15' },
    { name: /appraisal/i, value: '5000' },
    { name: /inspection/i, value: '4000' },
  ];
  for (const cc of closingCostRows) {
    const row = page.getByRole('row', { name: cc.name });
    await row.getByRole('textbox').dblclick();
    await row.getByRole('textbox').fill(cc.value);
  }

  // Attorney / Legal Closing Costs
  await page.getByRole('row', { name: /legal closing costs/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /legal closing costs/i }).getByRole('textbox').fill('7500');

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
  await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').fill('750');

  await page.getByRole('row', { name: /environmental testing/i }).getByRole('combobox').selectOption('per Unit');
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ / unit' }).getByRole('textbox').fill('500');
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: 'units' }).getByRole('textbox').fill('2');

  await page.getByRole('row', { name: /lender.*legal.*financing/i }).getByRole('textbox').dblclick();
  await page.getByRole('row', { name: /lender.*legal.*financing/i }).getByRole('textbox').fill('5000');

  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox').fill('3500');

  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').dblclick();
  await page.getByRole('gridcell', { name: '%' }).getByRole('textbox').fill('0.2');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 16: Reserves
  // ──────────────────────────────────────────────
  // Industrial Reserves rows:
  //   Loan Draws (Total), Cash Reserve: Debt Service (per Month),
  //   Cash Reserve: Mechanicals (per SF), Cash Reserve: Roof (Total),
  //   Leasing Cost Reserves (per Unit), Contingency (% of other expenses)

  // Loan Draws
  const loanDrawsRow = page.getByRole('row', { name: /loan draws/i });
  await loanDrawsRow.getByRole('textbox').dblclick();
  await loanDrawsRow.getByRole('textbox').fill('10000');

  // Cash Reserve: Debt Service (per Month — fill cost + months)
  const debtSvcRow = page.getByRole('row', { name: /debt service/i });
  const debtSvcInputs = debtSvcRow.locator('input[type="text"]');
  await debtSvcInputs.first().click();
  await debtSvcInputs.first().fill('20');
  // Months (statistic field)
  if (await debtSvcInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await debtSvcInputs.nth(1).click();
    await debtSvcInputs.nth(1).fill('6');
  }

  // Cash Reserve: Mechanicals (per SF)
  const mechRow = page.getByRole('row', { name: /mechanicals/i });
  const mechInputs = mechRow.locator('input[type="text"]');
  await mechInputs.first().click();
  await mechInputs.first().fill('0.25');
  if (await mechInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await mechInputs.nth(1).click();
    await mechInputs.nth(1).fill('45000');
  }

  // Cash Reserve: Roof (Total)
  const roofRow = page.getByRole('row', { name: /roof/i });
  await roofRow.getByRole('textbox').dblclick();
  await roofRow.getByRole('textbox').fill('15000');

  // Leasing Cost Reserves (per Unit)
  const leasingRow = page.getByRole('row', { name: /leasing cost/i });
  const leasingInputs = leasingRow.locator('input[type="text"]');
  await leasingInputs.first().click();
  await leasingInputs.first().fill('2');
  if (await leasingInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await leasingInputs.nth(1).click();
    await leasingInputs.nth(1).fill('2');
  }

  // Contingency (% of other expenses)
  const contingencyRow = page.getByRole('row', { name: /contingency/i });
  await contingencyRow.getByRole('textbox').dblclick();
  await contingencyRow.getByRole('textbox').fill('5');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 17: Hard Costs
  // ──────────────────────────────────────────────
  // Industrial rows: Demo (Total), Common Area (Total), Storage Buildout (per Unit),
  //   Permits (per SF), Interior (per SF), Unit Rehabs (per Unit), Contingency (%)

  // Demo
  const demoRow = page.getByRole('row', { name: /demo/i });
  await demoRow.getByRole('textbox').dblclick();
  await demoRow.getByRole('textbox').fill('15000');

  // Common Area
  const commonRow = page.getByRole('row', { name: /common area/i });
  await commonRow.getByRole('textbox').dblclick();
  await commonRow.getByRole('textbox').fill('25000');

  // Storage Buildout (per Unit)
  const storageRow = page.getByRole('row', { name: /storage buildout/i });
  const storageInputs = storageRow.locator('input[type="text"]');
  await storageInputs.first().click();
  await storageInputs.first().fill('500');
  if (await storageInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await storageInputs.nth(1).click();
    await storageInputs.nth(1).fill('2');
  }

  // Permits (per SF)
  const permitsRow = page.getByRole('row', { name: /permits/i });
  const permitsInputs = permitsRow.locator('input[type="text"]');
  await permitsInputs.first().click();
  await permitsInputs.first().fill('1.5');
  if (await permitsInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await permitsInputs.nth(1).click();
    await permitsInputs.nth(1).fill('45000');
  }

  // Interior (per SF)
  const interiorRow = page.getByRole('row', { name: /interior/i });
  const interiorInputs = interiorRow.locator('input[type="text"]');
  await interiorInputs.first().click();
  await interiorInputs.first().fill('2');
  if (await interiorInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await interiorInputs.nth(1).click();
    await interiorInputs.nth(1).fill('45000');
  }

  // Unit Rehabs (per Unit)
  const rehabsRow = page.getByRole('row', { name: /unit rehabs/i });
  const rehabsInputs = rehabsRow.locator('input[type="text"]');
  await rehabsInputs.first().click();
  await rehabsInputs.first().fill('1000');
  if (await rehabsInputs.nth(1).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await rehabsInputs.nth(1).click();
    await rehabsInputs.nth(1).fill('2');
  }

  // Contingency (%)
  const hcContingencyRow = page.getByRole('row', { name: /contingency/i });
  await hcContingencyRow.getByRole('textbox').dblclick();
  await hcContingencyRow.getByRole('textbox').fill('5');

  await page.getByRole('button', { name: /continue/i }).click();

  // ──────────────────────────────────────────────
  // Step 18: Exit / Hold Period
  // ──────────────────────────────────────────────
  await page.getByRole('textbox').first().dblclick();
  await page.getByRole('textbox').first().fill('7');

  await page.getByRole('textbox').nth(1).dblclick();
  await page.getByRole('textbox').nth(1).fill('84');

  await page.getByRole('textbox').nth(2).dblclick();
  await page.getByRole('textbox').nth(2).fill('6.5');

  await page.getByRole('button', { name: /finish/i }).click();

  // ──────────────────────────────────────────────
  // Verify: Model Details page loads
  // ──────────────────────────────────────────────
  await expect(page).toHaveURL(/\/models\//, { timeout: 60_000 });
  await expect(page.getByText(modelName)).toBeVisible({ timeout: 10_000 });

  // ──────────────────────────────────────────────
  // Verify: All tabs are accessible
  // ──────────────────────────────────────────────
  const tabs = [
    'Summary',
    'Income and Expenses',
    'Annual NOI',
    'Year 1 Income Summary',
    'Returns Summary',
    'Sources and Uses',
    'Notes & Pictures',
  ];

  for (const tabName of tabs) {
    const tab = page.getByRole('tab', { name: tabName, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
});
