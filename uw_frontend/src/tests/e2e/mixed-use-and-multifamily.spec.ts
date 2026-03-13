import { test, expect } from '@playwright/test';

const MODEL_NAME_PREFIX = 'Development Regression';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Multifamily and Mixed-Use Development Model Creation Flow', () => {
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
        test.setTimeout(400_000);

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

        const mixedRadio = page.getByRole('radio', { name: /Multifamily and Mixed-Use Development/i });
        await expect(mixedRadio).toBeVisible({ timeout: 20000 });
        await mixedRadio.check();
        await page.getByRole('button', { name: /next/i }).click();

        await expect(page.getByText(/Awesome! Let's get started/i)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /get started/i }).click();

        await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
        await page.getByRole('textbox', { name: /address/i }).fill('123 Dev Way');
        await page.getByRole('textbox', { name: /city/i }).fill('San Francisco');
        await page.getByRole('textbox', { name: /state/i }).fill('CA');
        await page.getByRole('textbox', { name: /zip code/i }).fill('94105');
        await page.getByRole('button', { name: /continue/i }).click();

        const askingPrice = page.getByRole('textbox', { name: /asking price/i });
        await askingPrice.dblclick();
        await askingPrice.fill('20000000');

        const acqPrice = page.getByRole('textbox', { name: /acquisition price/i });
        await acqPrice.dblclick();
        await acqPrice.fill('18000000');

        await page.locator('input[type="date"]').fill('2026-07-01');

        const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
        await grossSf.click();
        await grossSf.fill('150000');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { name: /Rent Assumptions/i })).toBeVisible();
        
        await page.getByLabel(/Add or select Unit Type/i).fill('Studio');
        await page.getByRole('button', { name: /Add Unit Type/i }).click();
        
        const studioRow = page.locator('.MuiDataGrid-row').filter({ hasText: 'Studio' });
        await studioRow.locator('.MuiDataGrid-cell[data-field="avg_sf"] input').fill('600');
        await studioRow.locator('.MuiDataGrid-cell[data-field="units"] input').fill('20');
        await studioRow.locator('.MuiDataGrid-cell[data-field="avg_rent"] input').fill('2500');

        await page.getByLabel(/Add or select Unit Type/i).fill('1 Bdrm');
        await page.getByRole('button', { name: /Add Unit Type/i }).click();
        const bdrmRow = page.locator('.MuiDataGrid-row').filter({ hasText: '1 Bdrm' });
        await bdrmRow.locator('.MuiDataGrid-cell[data-field="avg_sf"] input').fill('800');
        await bdrmRow.locator('.MuiDataGrid-cell[data-field="units"] input').fill('30');
        await bdrmRow.locator('.MuiDataGrid-cell[data-field="avg_rent"] input').fill('3200');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { level: 3, name: /Retail Income/i })).toBeVisible();
        await page.getByRole('button', { name: /add retail unit/i }).click();
        const firstRetailRow = page.locator('.MuiDataGrid-row').first();
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="suite"] input').fill('101');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="tenant_name"] input').fill('Corner Grocery');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="square_feet"] input').fill('5000');
        await firstRetailRow.locator('.MuiDataGrid-cell[data-field="rent_per_square_foot_per_year"] input').fill('50');
        
        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('textbox').first().dblclick();
        await page.getByRole('textbox').first().fill('2');
        const unitCountCell = page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox').first();
        await unitCountCell.dblclick();
        await unitCountCell.fill('25');
        const feeCell = page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox');
        await feeCell.dblclick();
        await feeCell.fill('200');

        await page.getByRole('button', { name: /continue/i }).click();

        const mfTaxInput = page.getByRole('row', { name: /property taxes/i }).locator('.no-spinner').first();
        await mfTaxInput.dblclick();
        await mfTaxInput.fill('250000');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { level: 3, name: /Hard Costs/i })).toBeVisible();
        await page.getByRole('row').nth(1).getByRole('textbox').first().dblclick();
        await page.getByRole('row').nth(1).getByRole('textbox').first().fill('1000000');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByRole('heading', { name: /Net Operating Income/i })).toBeVisible();
        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { level: 3, name: /Senior Construction Loan/i })).toBeVisible();
        
        const loanAmountInput = page.getByLabel(/Exact Loan Amount/i);
        await loanAmountInput.dblclick();
        await loanAmountInput.fill('12000000');

        const rateTypeCombo = page.getByRole('combobox').first();
        await rateTypeCombo.click({ force: true });
        await page.getByRole('option', { name: 'Fixed' }).click();

        const fixedRateInput = page.getByLabel(/Fixed Rate for Sr. Cons. Loan/i);
        await fixedRateInput.dblclick();
        await fixedRateInput.fill('7.5');
        
        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { level: 3, name: /Second Lien/i })).toBeVisible();
        const secondAmount = page.getByLabel(/Pref. Equity \/ Mezz. Loan Amount/i);
        await secondAmount.dblclick();
        await secondAmount.fill('2000000');

        const secondRate = page.getByLabel(/Interest Rate \(Accrual\)/i);
        await secondRate.dblclick();
        await secondRate.fill('10');
        
        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByText(/Model a refinancing\?/i)).toBeVisible();
        const refiSelect = page.locator('.MuiSelect-select').first();
        await refiSelect.click();
        await page.getByRole('option', { name: 'Yes' }).click();

        await page.getByPlaceholder(/Enter month number/i).fill('36');
        const refiRate = page.getByLabel(/Fixed Interest Rate/i);
        await refiRate.dblclick();
        await refiRate.fill('6.0');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.locator('#create-model-content').getByText('Leasing Assumptions', { exact: true })).toBeVisible();
        const rehabInput = page.getByRole('textbox', { name: /rehab \/ renovations/i });
        await rehabInput.dblclick();
        await rehabInput.fill('12');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('row', { name: /acquisition fee/i }).getByRole('textbox').first().dblclick();
        await page.getByRole('row', { name: /acquisition fee/i }).getByRole('textbox').first().fill('1.0');
        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('row', { name: /legal/i }).getByRole('textbox').first().dblclick();
        await page.getByRole('row', { name: /legal/i }).getByRole('textbox').first().fill('50000');
        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByRole('heading', { level: 3, name: /Soft Costs/i })).toBeVisible();
        await page.getByRole('row').nth(1).getByRole('textbox').first().dblclick();
        await page.getByRole('row').nth(1).getByRole('textbox').first().fill('200000');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText(/Multifamily Exit Assumptions/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Retail Exit Assumptions/i)).toBeVisible();

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
