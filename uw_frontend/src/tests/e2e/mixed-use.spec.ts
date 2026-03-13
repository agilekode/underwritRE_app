import { test, expect } from '@playwright/test';

const MODEL_NAME_PREFIX = 'Mixed-Use Regression';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Mixed-Use Model Creation Flow', () => {
    let modelId: string | null = null;
    let authToken: string | null = null;
    const modelName = `${MODEL_NAME_PREFIX} ${Date.now()}`;

    test.afterAll(async ({ request }) => {
        if (modelId && authToken) {
            const response = await request.patch(`${process.env.REACT_APP_BACKEND_URL}/api/user_models/${modelId}/active`, {
                data: { active: false },
                headers: { Authorization: authToken },
            });
            if (response.ok()) {
                console.log(`Successfully deactivated model ${modelId}`);
            } else {
                console.warn(`Failed to deactivate model ${modelId}: ${response.status()}`);
            }
        }
    });

    test('walk through complete flow and verify results', async ({ page }) => {
        test.setTimeout(300_000);

        await page.goto('/');
        await page.addStyleTag({ content: '#webpack-dev-server-client-overlay { display: none !important; }' }).catch(() => { });

        page.on('request', (req) => {
            if (!authToken && req.url().includes('/api/') && req.headers()['authorization']) {
                authToken = req.headers()['authorization'];
            }
        });

        const startLoginBtn = page.getByRole('button', { name: /log in with email or google/i });
        if (await startLoginBtn.isVisible().catch(() => false)) {
            await startLoginBtn.click();
        }

        const emailInput = page.locator('input[type="email"], input[name="email" i], input[name="username" i], input[placeholder*="email" i]').first();
        await expect(emailInput).toBeVisible({ timeout: 20000 });
        await emailInput.fill(process.env.E2E_EMAIL ?? '');

        const continueBtn = page.getByRole('button', { name: /continue|next|log in|sign in/i }).first();
        await continueBtn.click();

        const passwordInput = page.locator('input[type="password"], input[name="password" i], input[placeholder*="password" i]').first();
        await expect(passwordInput).toBeVisible({ timeout: 20000 });
        await passwordInput.fill(process.env.E2E_PASSWORD ?? '');

        const loginSubmit = page.getByRole('button', { name: /continue|log in|sign in/i }).first();
        await loginSubmit.click();

        await expect(page.getByRole('button', { name: /your models/i })).toBeVisible({ timeout: 30000 });

        const createModelBtn = page.getByRole('button', { name: /create model/i }).first();
        await createModelBtn.click();
        await expect(page).toHaveURL(/\/create-model/);

        const mixedRadio = page.getByRole('radio', { name: /Mixed Use/i });
        await expect(mixedRadio).toBeVisible({ timeout: 20000 });
        await mixedRadio.check();
        await page.getByRole('button', { name: /next/i }).click();

        await expect(page.getByText(/Awesome! Let's get started/i)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /get started/i }).click();

        await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
        await page.getByRole('textbox', { name: /address/i }).fill('789 Mixed Blvd');
        await page.getByRole('textbox', { name: /city/i }).fill('New York');
        await page.getByRole('textbox', { name: /state/i }).fill('NY');
        await page.getByRole('textbox', { name: /zip code/i }).fill('10001');
        await page.getByRole('button', { name: /continue/i }).click();

        const askingPrice = page.getByRole('textbox', { name: /asking price/i });
        await askingPrice.dblclick();
        await askingPrice.fill('10000000');

        const acqPrice = page.getByRole('textbox', { name: /acquisition price/i });
        await acqPrice.dblclick();
        await acqPrice.fill('9500000');

        await page.locator('input[type="date"]').fill('2026-06-01');

        const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
        await grossSf.click();
        await grossSf.fill('80000');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('gridcell', { name: /studio/i }).getByRole('combobox').selectOption('2BR');
        const sfCell = page.getByRole('gridcell', { name: 'sf' }).getByRole('textbox');
        await sfCell.dblclick();
        await sfCell.fill('1000');
        const rentCell = page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox');
        await rentCell.dblclick();
        await rentCell.fill('2500');

        await page.getByRole('button', { name: /continue/i }).click();

        const marketDialog = page.locator('.MuiDialog-root');
        await expect(marketDialog).toBeVisible({ timeout: 10000 });
        const rentInputs = marketDialog.locator('input[type="text"], input.no-spinner');
        await rentInputs.nth(0).dblclick();
        await rentInputs.nth(0).fill('3000');
        await marketDialog.locator('button:has-text("Done")').click();
        await expect(marketDialog).toBeHidden();

        const vacateSelect = page.getByRole('gridcell', { name: /keep tenant/i }).getByRole('combobox');
        await vacateSelect.selectOption('Vacate & Re-Lease');

        await page.getByRole('button', { name: /continue/i }).click();

        const addRetailBtn = page.getByRole('button', { name: /add retail unit/i });
        await addRetailBtn.click();

        const firstRetailRow = page.locator('.MuiDataGrid-row').first();
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="suite"] input').fill('101');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="tenant_name"] input').fill('Coffee Shop');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="lease_start_month"] input').fill('0');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="lease_end_month"] input').fill('120');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="square_feet"] input').fill('2000');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="rent_start_month"] input').fill('3');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="annual_bumps"] input').fill('3');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="rent_per_square_foot_per_year"] input').fill('45');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('textbox').first().dblclick();
        await page.getByRole('textbox').first().fill('2');
        const feeCell = page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox');
        await feeCell.dblclick();
        await feeCell.fill('150');

        await page.getByRole('button', { name: /continue/i }).click();

        const mfTaxInput = page.getByRole('row', { name: /property taxes/i }).locator('.no-spinner').first();
        await mfTaxInput.dblclick();
        await mfTaxInput.fill('10000');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { name: /Net Operating Income/i })).toBeVisible();
        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).dblclick();
        await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).fill('6.0');
        await page.getByRole('textbox', { name: /loan-to-value/i }).dblclick();
        await page.getByRole('textbox', { name: /loan-to-value/i }).fill('70');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.locator('#create-model-content').getByText('Leasing Assumptions', { exact: true })).toBeVisible();
        const rehabInput = page.getByRole('textbox', { name: /rehab \/ renovations/i });
        await rehabInput.dblclick();
        await rehabInput.fill('4');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByText(/Model a refinancing\?/i)).toBeVisible();

        await page.getByPlaceholder(/Enter month number/i).fill('24');

        const refiRate = page.getByLabel(/Fixed Interest Rate/i);
        await refiRate.dblclick();
        await refiRate.fill('5.0');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('row', { name: /acquisition fee/i }).getByRole('textbox').dblclick();
        await page.getByRole('row', { name: /acquisition fee/i }).getByRole('textbox').fill('1.0');
        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').dblclick();
        await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').fill('500');
        await page.getByRole('button', { name: /continue/i }).click();

        const reserveInput = page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').first();
        await reserveInput.dblclick();
        await reserveInput.fill('100');
        await page.getByRole('button', { name: /continue/i }).click();

        const hardCostInput = page.getByRole('row', { name: /roof/i }).getByRole('textbox');
        if (await hardCostInput.isVisible()) {
            await hardCostInput.dblclick();
            await hardCostInput.fill('50000');
        } else {
            await page.getByRole('row').nth(1).getByRole('textbox').dblclick();
            await page.getByRole('row').nth(1).getByRole('textbox').fill('10000');
        }
        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByText(/Multifamily Exit Assumptions/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Retail Exit Assumptions/i)).toBeVisible();
        await expect(page.getByText(/Combined Exit Summary/i)).toBeVisible();

        const exitCapRateInput = page.locator('div:has(p:has-text("Multifamily Applied Exit Cap Rate")) input').nth(1);
        await exitCapRateInput.fill('5.25');

        const rtCapInput = page.locator('div', { hasText: 'Retail Applied Exit Cap Rate' }).locator('input').nth(4);
        await rtCapInput.fill('5.25');

        const [responseFinal] = await Promise.all([
            page.waitForResponse(async r => {
                if (r.url().includes('/api/user_models') && r.status() === 201) {
                    const data = await r.json();
                    return data && data.id;
                }
                return false;
            }),
            page.getByRole('button', { name: /finish/i }).click(),
        ]);

        const finalData = await responseFinal.json();
        modelId = finalData.id;

        await expect(page).toHaveURL(new RegExp(`/models/${modelId}`));
        await expect(page.getByText(modelName)).toBeVisible({ timeout: 20000 });
        await expect(page.getByText(/irr|moic/i).first()).toBeVisible();
    });
});
