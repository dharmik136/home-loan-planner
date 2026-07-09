import { test, expect } from '@playwright/test';
import * as path from 'path';

test('End-to-End User Flow verification', async ({ page }) => {
  const filePath = path.resolve(process.cwd(), 'dist/index.html');
  const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
  
  await page.goto(fileUrl);
  
  // 1. Verify landing page title
  await expect(page.locator('h1')).toContainText('Before you prepay');
  
  // 2. Click the CTA to navigate to the app workspace
  await page.click('#hero-cta-free');
  
  // 3. Verify app page title
  await expect(page.locator('h1')).toContainText('The Prepayment');
  
  // 4. Verify two default loans are rendered
  await expect(page.locator('.loan-card')).toHaveCount(2);
  
  // 3. Add a new loan
  await page.click('button:has-text("Add another loan")');
  await expect(page.locator('.loan-card')).toHaveCount(3);
  
  // 4. Rename the new loan
  const thirdCardNameInput = page.locator('.loan-card').nth(2).locator('input[placeholder="Loan Name"]');
  await thirdCardNameInput.fill('My Car Loan');
  await expect(thirdCardNameInput).toHaveValue('My Car Loan');
  
  // 5. Check optimal split in windfall simulator, Rollover Planner & Portfolio Chart
  await expect(page.locator('text=Smart Windfall Allocator')).toBeVisible();
  await expect(page.locator('text=Portfolio Rollover Planner')).toBeVisible();
  await expect(page.locator('text=Total Outstanding Debt Over Time')).toBeVisible();
  
  // 6. Delete the new loan
  await page.locator('.loan-card').nth(2).locator('button[title="Delete loan"]').click();
  await expect(page.locator('.loan-card')).toHaveCount(2);
});
