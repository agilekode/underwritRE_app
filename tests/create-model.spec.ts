import { test, expect, type Page, type Locator } from '@playwright/test';

const USER_EMAIL = process.env.PLAYWRIGHT_USER_EMAIL ?? 'cdurkin@underwritre.com';

const MODEL_INPUTS = {
  propertyNamePrefix: 'PW Multifamily',
  address: '123 Test Avenue',
  city: 'Test City',
  state: 'TX',
  zip: '11111',
  askingPrice: '1000000',
  acquisitionPrice: '950000',
  grossSqFt: '5000',
  unitSqFt: '750',
  unitRent: '1500',
  marketRent: '1750',
  closeDate: '2026-02-12'
};

test('create multifamily model (robust)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');

  await ensureLoggedIn(page);
  await openCreateModel(page);
  await selectModelType(page, 'Multifamily');

  await runStepper(page);
  await page.waitForURL(/\/models\//, { timeout: 120_000 });
  await waitForModelLanding(page);
});

const ensureLoggedIn = async (page: Page) => {
  const loginBtn = page.getByRole('button', { name: /log in with email or google/i });
  const createModelNav = page
    .getByRole('button', { name: /create model/i })
    .or(page.getByRole('link', { name: /create model/i }));
  const logoutNav = page
    .getByRole('button', { name: /log out/i })
    .or(page.getByRole('link', { name: /log out/i }));

  await waitForAnyVisible([loginBtn, createModelNav, logoutNav], 15000);

  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click();
    await page.getByRole('textbox', { name: /email address/i }).fill(USER_EMAIL);
    await page.getByRole('button', { name: /^continue$/i }).click();
    await page.getByRole('button', { name: /^continue$/i }).click();
  }

  await expect(createModelNav, 'Expected Create Model nav after login').toBeVisible();
};

const openCreateModel = async (page: Page) => {
  const createModelNav = page
    .getByRole('button', { name: /create model/i })
    .or(page.getByRole('link', { name: /create model/i }));
  await createModelNav.click();
  await expect(page).toHaveURL(/\/create-model/);
  await expect(page.getByRole('heading', { name: /new investment model/i })).toBeVisible();
};

const selectModelType = async (page: Page, modelType: string) => {
  const modelRadio = page.getByRole('radio', { name: modelType, exact: true });
  await expect(modelRadio).toBeVisible();
  await expect(modelRadio).toBeEnabled();
  await modelRadio.check();
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('heading', { level: 3 })).toBeVisible({ timeout: 30000 });
};

const runStepper = async (page: Page) => {
  for (let i = 0; i < 30; i++) {
    const stepName = await getStepName(page);

    switch (stepName) {
      case 'Property Address':
        await fillPropertyAddress(page);
        break;
      case 'General Property Assumptions':
        await fillGeneralPropertyAssumptions(page);
        await fillRequiredFields(page);
        break;
      case 'Residential Rental Units':
        await fillFirstUnitRow(page, MODEL_INPUTS.unitSqFt, MODEL_INPUTS.unitRent);
        break;
      case 'Market Rent Assumptions':
        await closeMarketRentModalIfOpen(page, { waitFor: true, fillValue: MODEL_INPUTS.marketRent });
        break;
      default:
        await fillRequiredFields(page);
        break;
    }

    const isLast = stepName === 'Exit Assumptions';
    await clickPrimaryNav(page, stepName, isLast);
    if (isLast) break;
  }
};

const getStepHeading = (page: Page) => page.locator('#create-model-content h3').first();

const getStepName = async (page: Page) => {
  const heading = getStepHeading(page);
  await heading.waitFor({ state: 'visible', timeout: 30000 });
  const text = (await heading.textContent())?.trim() ?? '';
  return text.split(':')[0].trim();
};

const clickPrimaryNav = async (page: Page, currentStep: string, isLast: boolean) => {
  const label = isLast ? /^finish$/i : /^continue$/i;
  const button = page.getByRole('button', { name: label });
  await expect(button).toBeEnabled({ timeout: 60000 });
  const heading = getStepHeading(page);
  await heading.waitFor({ state: 'visible', timeout: 30000 });
  const previousStep = currentStep.trim();
  await button.click();

  if (!isLast) {
    await page.waitForFunction(
      (prev) => {
        const el = document.querySelector('#create-model-content h3');
        const text = el?.textContent?.trim() ?? '';
        return Boolean(text) && !text.startsWith(prev);
      },
      previousStep,
      { timeout: 30000 }
    );
  } else {
    const creating = page.getByRole('button', { name: /creating model/i });
    await creating.waitFor({ state: 'visible', timeout: 60000 }).catch(() => null);
  }
};

const fillPropertyAddress = async (page: Page) => {
  const propertyName = `${MODEL_INPUTS.propertyNamePrefix} ${new Date().toISOString().slice(0, 10)} ${Date.now()}`;
  await page.getByRole('textbox', { name: /property name/i }).fill(propertyName);
  await page.getByRole('textbox', { name: /^address$/i }).fill(MODEL_INPUTS.address);
  await page.getByRole('textbox', { name: /^city$/i }).fill(MODEL_INPUTS.city);
  await page.getByRole('textbox', { name: /^state$/i }).fill(MODEL_INPUTS.state);
  await page.getByRole('textbox', { name: /^zip code$/i }).fill(MODEL_INPUTS.zip);
};

const fillFirstUnitRow = async (page: Page, squareFeet: string, rent: string) => {
  const grid = page.locator('#create-model-content .MuiDataGrid-root').first();
  await expect(grid).toBeVisible();
  const firstRow = grid.locator('.MuiDataGrid-row').first();
  await firstRow.locator('[data-field="square_feet"] input').fill(squareFeet);
  await firstRow.locator('[data-field="current_rent"] input').fill(rent);
};

const fillGeneralPropertyAssumptions = async (page: Page) => {
  await fillIfVisible(page.getByPlaceholder(/enter asking price/i), MODEL_INPUTS.askingPrice);
  await fillIfVisible(page.getByPlaceholder(/enter acquisition price/i), MODEL_INPUTS.acquisitionPrice);
  await fillIfVisible(page.getByPlaceholder(/enter gross square feet/i), MODEL_INPUTS.grossSqFt);
  await fillIfVisible(page.locator('input[type="date"]'), MODEL_INPUTS.closeDate);
};

const closeMarketRentModalIfOpen = async (
  page: Page,
  options: { waitFor?: boolean; timeoutMs?: number; fillValue?: string } = {}
) => {
  const { waitFor = false, timeoutMs = 15000, fillValue = '1750' } = options;
  const dialog = page.getByRole('dialog', { name: /determine market rents/i });

  if (waitFor) {
    await dialog.waitFor({ state: 'visible', timeout: timeoutMs }).catch(() => null);
  }

  if (await dialog.isVisible().catch(() => false)) {
    const inputs = dialog.locator('input[type="text"]');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (!(await input.isVisible().catch(() => false))) continue;
      const current = (await input.inputValue().catch(() => '')).trim();
      if (!current || current === '0') {
        await input.fill(fillValue);
      }
    }
    await dialog.getByRole('button', { name: /done/i }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => null);
  }
};

const fillRequiredFields = async (page: Page) => {
  const requiredInputs = page.locator('input[required], textarea[required]');
  const count = await requiredInputs.count();
  for (let i = 0; i < count; i++) {
    const input = requiredInputs.nth(i);
    if (!(await input.isVisible().catch(() => false))) continue;
    if (!(await input.isEnabled().catch(() => false))) continue;
    const value = await input.inputValue().catch(() => '');
    if (value) continue;
    const type = (await input.getAttribute('type')) ?? 'text';
    await input.fill(type === 'date' ? MODEL_INPUTS.closeDate : '1');
  }

  const selectTriggers = page.getByRole('button', { name: /select an option/i });
  const selectCount = await selectTriggers.count();
  for (let i = 0; i < selectCount; i++) {
    const trigger = selectTriggers.nth(i);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    await trigger.click();
    const option = page.getByRole('option').first();
    await option.click();
  }

  const radioGroups = page.locator('[role="radiogroup"]');
  const groupCount = await radioGroups.count();
  for (let i = 0; i < groupCount; i++) {
    const group = radioGroups.nth(i);
    const checked = group.locator('input[type="radio"][checked]');
    if ((await checked.count()) === 0) {
      const firstRadio = group.getByRole('radio').first();
      if (await firstRadio.isVisible().catch(() => false)) {
        await firstRadio.check();
      }
    }
  }
};

const fillIfVisible = async (locator: Locator, value: string) => {
  if (await locator.isVisible().catch(() => false)) {
    await locator.fill(value);
  }
};

const waitForAnyVisible = async (locators: Locator[], timeoutMs: number) => {
  await Promise.any(
    locators.map((locator) => locator.waitFor({ state: 'visible', timeout: timeoutMs }))
  );
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const waitForModelLanding = async (page: Page) => {
  await page.getByText(/model type:/i).waitFor({ state: 'visible', timeout: 120_000 });
  await expect(page.getByRole('tab', { name: /summary/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /income and expenses/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /notes & pictures/i })).toBeVisible();
};
