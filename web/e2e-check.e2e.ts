import { test, expect } from '@playwright/test';
import * as path from 'path';

test('End-to-End User Flow verification', async ({ page }) => {
  const filePath = path.resolve(process.cwd(), 'dist/index.html');
  const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
  
  await page.goto(fileUrl);
  
  // 1. Verify page title
  await expect(page.locator('h1')).toContainText('The Prepayment');
  
  // 2. Verify two default loans are rendered
  await expect(page.locator('.loan-card')).toHaveCount(2);
  
  // 3. Add a new loan
  await page.click('button:has-text("Add another loan")');
  await expect(page.locator('.loan-card')).toHaveCount(3);
  
  // 4. Rename the new loan
  const thirdCardNameInput = page.locator('.loan-card').nth(2).locator('input[placeholder="Loan Name"]');
  await thirdCardNameInput.fill('My Car Loan');
  await expect(thirdCardNameInput).toHaveValue('My Car Loan');
  
  // 5. Check optimal split in windfall simulator
  await expect(page.locator('text=Smart Windfall Allocator')).toBeVisible();
  
  // 6. Delete the new loan
  await page.locator('.loan-card').nth(2).locator('button[title="Delete loan"]').click();
  await expect(page.locator('.loan-card')).toHaveCount(2);
});
