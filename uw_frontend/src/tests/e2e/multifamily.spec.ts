import { test, expect } from '@playwright/test';

const MODEL_NAME_PREFIX = 'Multifamily Regression';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Multifamily Model Creation Flow', () => {
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

        const mfRadio = page.getByRole('radio', { name: 'Multifamily', exact: true });
        await expect(mfRadio).toBeVisible({ timeout: 20000 });
        await mfRadio.check();
        await page.getByRole('button', { name: /next/i }).click();
        await page.getByRole('button', { name: /get started/i }).click();

        await page.getByRole('textbox', { name: /property name/i }).fill(modelName);
        await page.getByRole('textbox', { name: /address/i }).fill('456 E2E St');
        await page.getByRole('textbox', { name: /city/i }).fill('Chicago');
        await page.getByRole('textbox', { name: /state/i }).fill('IL');
        await page.getByRole('textbox', { name: /zip code/i }).fill('60601');
        await page.getByRole('button', { name: /continue/i }).click();

        const askingPrice = page.getByRole('textbox', { name: /asking price/i });
        await askingPrice.dblclick();
        await askingPrice.fill('2000000');

        const acqPrice = page.getByRole('textbox', { name: /acquisition price/i });
        await acqPrice.dblclick();
        await acqPrice.fill('1900000');

        await page.locator('input[type="date"]').fill('2026-06-01');

        const grossSf = page.getByRole('textbox', { name: /gross square feet/i });
        await grossSf.click();
        await grossSf.fill('10000');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('gridcell', { name: /studio/i }).getByRole('combobox').selectOption('2BR');
        const sfCell = page.getByRole('gridcell', { name: 'sf' }).getByRole('textbox');
        await sfCell.dblclick();
        await sfCell.fill('1200');

        const rentCell = page.getByRole('gridcell', { name: '$ / month' }).getByRole('textbox');
        await rentCell.click();
        await rentCell.fill('2500');

        await page.getByRole('button', { name: /continue/i }).click();

        const marketDialog = page.locator('.MuiDialog-root');
        await expect(marketDialog).toBeVisible({ timeout: 10000 });

        const rentInputs = marketDialog.locator('input[type="text"]');
        await rentInputs.nth(0).dblclick();
        await rentInputs.nth(0).fill('3000');

        const doneButton = marketDialog.locator('button:has-text("Done")');
        await doneButton.click();

        await expect(marketDialog).toBeHidden();

        const vacateSelect = page.getByRole('gridcell', { name: /keep tenant/i }).getByRole('combobox');
        await vacateSelect.selectOption('Vacate & Re-Lease');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('textbox').first().dblclick();
        await page.getByRole('textbox').first().fill('2');

        const utilCell = page.getByRole('gridcell', { name: '0', exact: true }).getByRole('textbox');
        await utilCell.nth(0).dblclick();
        await utilCell.nth(0).fill('10');

        const feeCell = page.getByRole('gridcell', { name: '$ 0' }).getByRole('textbox');
        await feeCell.dblclick();
        await feeCell.fill('150');

        await page.getByRole('button', { name: /continue/i }).click();

        const taxInput = page.getByRole('row', { name: /property taxes/i }).locator('.no-spinner');
        await taxInput.dblclick();
        await taxInput.fill('500');
        await taxInput.press('Tab');

        await page.getByRole('button', { name: /continue/i }).click();

        const [responseIntermediate] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/user_models_intermediate') && r.status() === 201),
            page.getByRole('button', { name: /continue/i }).click(),
        ]);
        expect(responseIntermediate.ok()).toBeTruthy();

        await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).dblclick();
        await page.getByRole('textbox', { name: /acquisition loan interest rate/i }).fill('5.5');

        await page.getByRole('textbox', { name: /loan-to-value/i }).dblclick();
        await page.getByRole('textbox', { name: /loan-to-value/i }).fill('75');

        await page.getByRole('button', { name: /continue/i }).click();

        await page.getByRole('button', { name: /continue/i }).click();

        const refiSelect = page.getByRole('combobox').first();
        await refiSelect.click();
        await page.getByRole('option', { name: 'Yes' }).click();

        await page.getByRole('textbox', { name: /enter month number/i }).dblclick();
        await page.getByRole('textbox', { name: /enter month number/i }).fill('36');

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

        await page.getByRole('textbox').first().dblclick();
        await page.getByRole('textbox').first().fill('60');

        const exitCapRateInput = page
            .locator('div:has(p:has-text("Multifamily Applied Exit Cap Rate")) input')
            .nth(1);

        await exitCapRateInput.fill('5.25');

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
