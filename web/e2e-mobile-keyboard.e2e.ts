import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe("Mobile & Interactive UX Integrity", () => {
  let fileUrl: string;

  test.beforeAll(() => {
    const filePath = path.resolve(process.cwd(), 'dist/index.html');
    fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
  });

  // 1. Mobile Viewport & Chart Fallback
  test("Verify layout responsiveness and chart rendering under mobile viewports", async ({ page }) => {
    // Set mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(fileUrl);
    
    // Verify landing CTA is visible on mobile
    const startCta = page.getByRole('button', { name: /Open planner/i });
    await expect(startCta).toBeVisible();
    await startCta.click();
    
    // Check mobile layout column stacking (elements stack vertically)
    const leftCol = page.locator('.col-left');
    const midCol = page.locator('.col-mid');
    const rightCol = page.locator('.col-right');
    
    await expect(leftCol).toBeVisible();
    await expect(midCol).toBeVisible();
    await expect(rightCol).toBeVisible();
    
    // Verify chart container does not break/leak on mobile screen
    const chartContainer = page.locator('.chart-wrap').first();
    await expect(chartContainer).toBeVisible();
    const box = await chartContainer.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  // 2. Input Keyboard & Focus Dismiss Behavior
  test("Verify numeric inputs have numeric inputmodes and keyboard focus dismisses on outside clicks", async ({ page }) => {
    await page.goto(fileUrl);
    await page.getByRole('button', { name: /Open planner/i }).click();

    // 1. Check inputmode attribute for numeric input fields
    const principalInput = page.locator('input[inputmode="numeric"]').first();
    await expect(principalInput).toBeVisible();
    
    const rateInput = page.locator('input[inputmode="decimal"]').first();
    await expect(rateInput).toBeVisible();

    // 2. Simulating keyboard dismiss by clicking outside the input
    await principalInput.focus();
    await expect(principalInput).toBeFocused();
    
    // Click on app title text to remove focus
    await page.locator('h1:has-text("The Prepayment Ledger")').click();
    await expect(principalInput).not.toBeFocused();
  });

  // 3. CTA Visibility & Modal Close Behavior
  test("Verify PDF CTA visibility and modal close/dismiss flows", async ({ page }) => {
    await page.goto(fileUrl);
    await page.getByRole('button', { name: /Open planner/i }).click();

    // Verify key save plan CTA button is visible
    const saveCta = page.getByRole('button', { name: /Save Plan & Get PDF/i });
    await expect(saveCta).toBeVisible();
    await saveCta.click();

    // Verify lead capture modal opens
    const modalHeader = page.locator('#save-plan-title');
    await expect(modalHeader).toBeVisible();

    // Verify closing modal using close button
    const closeBtn = page.locator('.modal-close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify modal is no longer visible
    await expect(modalHeader).not.toBeVisible();
  });
});
