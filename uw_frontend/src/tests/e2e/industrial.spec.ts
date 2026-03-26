import { test, expect } from '@playwright/test';

const MODEL_NAME_PREFIX = 'Industrial Regression';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Industrial Model Creation Flow', () => {
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
        test.setTimeout(240_000);

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

        const emailInput = page
            .locator('input[type="email"], input[name="email" i], input[name="username" i], input[placeholder*="email" i]')
            .first();
        await expect(emailInput).toBeVisible({ timeout: 20000 });
        await emailInput.fill(process.env.E2E_EMAIL ?? '');

        const continueAfterEmail = page.getByRole('button', { name: /continue|next|log in|sign in/i }).first();
        await expect(continueAfterEmail).toBeVisible({ timeout: 20000 });
        await continueAfterEmail.click();

        const passwordInput = page
            .locator('input[type="password"], input[name="password" i], input[placeholder*="password" i]')
            .first();
        await expect(passwordInput).toBeVisible({ timeout: 20000 });
        await passwordInput.fill(process.env.E2E_PASSWORD ?? '');

        const continueAfterPassword = page.getByRole('button', { name: /continue|log in|sign in/i }).first();
        await expect(continueAfterPassword).toBeVisible({ timeout: 20000 });
        await continueAfterPassword.click();

        await expect(page.getByRole('button', { name: /your models/i })).toBeVisible({ timeout: 30000 });

        const createModelBtn = page.getByRole('button', { name: /create model/i }).first();
        await createModelBtn.click();
        await expect(page).toHaveURL(/\/create-model/);

        const indRadio = page.getByRole('radio', { name: /Industrial/i });
        await expect(indRadio).toBeVisible({ timeout: 20000 });
        await indRadio.check();
        await page.getByRole('button', { name: /next/i }).click();
        await page.getByRole('button', { name: /get started/i }).click();

        await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
        await page.getByRole('textbox', { name: /address/i }).fill('456 Industrial Pkwy');
        await page.getByRole('textbox', { name: /city/i }).fill('Chicago');
        await page.getByRole('textbox', { name: /state/i }).fill('IL');
        await page.getByRole('textbox', { name: /zip code/i }).fill('60601');
        await page.getByRole('button', { name: /continue/i }).click();

        const askingPrice = page.getByRole('textbox', { name: /asking price/i });
        await askingPrice.dblclick();
        await askingPrice.fill('5000000');

        const acqPrice = page.getByRole('textbox', { name: /acquisition price/i });
        await acqPrice.dblclick();
        await acqPrice.fill('4800000');

        await page.locator('input[type="date"]').fill('2026-06-01');

        const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
        await grossSf.click();
        await grossSf.fill('50000');

        const yearBuilt = page.getByRole('textbox', { name: /year built/i });
        await yearBuilt.click();
        await yearBuilt.fill('2015');

        await page.getByRole('button', { name: /continue/i }).click();

        const addRetailUnitBtn = page.getByRole('button', { name: /add retail unit/i });
        await addRetailUnitBtn.click();

        let firstRow = page.locator('.MuiDataGrid-row').first();

        await firstRow.locator('.MuiDataGrid-cell[data-field="suite"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="suite"] input').fill('A');

        await firstRow.locator('.MuiDataGrid-cell[data-field="tenant_name"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="tenant_name"] input').fill('Industrial Corp');

        await firstRow.locator('.MuiDataGrid-cell[data-field="lease_start_month"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="lease_start_month"] input').fill('0');

        await firstRow.locator('.MuiDataGrid-cell[data-field="lease_end_month"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="lease_end_month"] input').fill('60');

        await firstRow.locator('.MuiDataGrid-cell[data-field="square_feet"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="square_feet"] input').fill('25000');

        await firstRow.locator('.MuiDataGrid-cell[data-field="rent_start_month"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="rent_start_month"] input').fill('0');

        await firstRow.locator('.MuiDataGrid-cell[data-field="annual_bumps"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="annual_bumps"] input').fill('3');

        await firstRow.locator('.MuiDataGrid-cell[data-field="rent_per_square_foot_per_year"] input').click();
        await firstRow.locator('.MuiDataGrid-cell[data-field="rent_per_square_foot_per_year"] input').fill('10');

        await page.getByRole('button', { name: /continue/i }).click();

        const taxInput = page.getByRole('row', { name: /property taxes/i }).locator('.no-spinner');
        await taxInput.dblclick();
        await taxInput.fill('5000');
        await taxInput.press('Tab');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByText(/recovery income/i)).toBeVisible();
        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByText(/Calculate the TILC Reserves/i)).toBeVisible({ timeout: 10000 });

        const renewalRow = page.locator('div:has(> div:has-text("Lease Renewal Probability"))').filter({ has: page.locator('input') });
        const renewalInput = renewalRow.locator('input').last();
        await renewalInput.click();
        await renewalInput.fill('75');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.getByText(/Base Retail Income/i).first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Gross Potential Retail Income/i).first()).toBeVisible();
        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('textbox').first().dblclick();
        await page.getByRole('textbox').first().fill('2');

        const utilCell = page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox');
        await utilCell.nth(0).dblclick();
        await utilCell.nth(0).fill('1');

        const feeCell = page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox');
        await feeCell.dblclick();
        await feeCell.fill('50');

        await page.getByRole('button', { name: /continue/i }).click();

        const [responseIntermediate] = await Promise.all([
            page.waitForResponse(async r => r.url().includes('/api/user_models_intermediate') && r.status() === 201),
            page.getByRole('button', { name: /continue/i }).click(),
        ]);
        expect(responseIntermediate.ok()).toBeTruthy();

        await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).dblclick();
        await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).fill('5.5');

        await page.getByRole('textbox', { name: /loan-to-value/i }).dblclick();
        await page.getByRole('textbox', { name: /loan-to-value/i }).fill('75');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('row', { name: /acquisition fee/i }).getByRole('textbox').dblclick();
        await page.getByRole('row', { name: /acquisition fee/i }).getByRole('textbox').fill('0.5');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').dblclick();
        await page.getByRole('row', { name: /business formation/i }).getByRole('textbox').fill('200');

        await page.getByRole('button', { name: /continue/i }).click();
        await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').first().dblclick();
        await page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox').first().fill('50');

        await page.getByRole('button', { name: /continue/i }).click();
        await page.getByRole('row', { name: /demo/i }).getByRole('textbox').dblclick();
        await page.getByRole('row', { name: /demo/i }).getByRole('textbox').fill('1000');

        await page.getByRole('button', { name: /continue/i }).click();

        await expect(page.locator('text="Multifamily Applied Exit Cap Rate"')).toHaveCount(0);

        await page.getByRole('textbox').first().dblclick();
        await page.getByRole('textbox').first().fill('60');

        const exitCapRateInput = page
            .locator('div:has(p:has-text("Rental Units Applied Exit Cap Rate")) input, div:has(p:has-text("Retail Applied Exit Cap Rate")) input, div:has(p:has-text("Applied Exit Cap Rate")) input')
            .nth(1);

        if (await exitCapRateInput.isVisible().catch(() => false)) {
            await exitCapRateInput.fill('6.0');
        }

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
