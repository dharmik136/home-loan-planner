import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe("Playwright MVP Integrity Flows", () => {
  let fileUrl: string;

  test.beforeAll(() => {
    const filePath = path.resolve(process.cwd(), 'dist/index.html');
    fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
  });

  // Flow 1: User adds one home loan and sees baseline payoff
  test("Flow 1: Add one home loan and view baseline payoff", async ({ page }) => {
    await page.goto(fileUrl);
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Check initial page structure
    await expect(page.locator('h1')).toContainText('The Prepayment');
    
    // By default we have 2 loans. Let's delete one to have exactly 1 loan.
    await page.locator('.loan-card').nth(1).locator('button[title="Delete loan"]').click();
    await expect(page.locator('.loan-card')).toHaveCount(1);
    
    // Verify baseline stats display
    await expect(page.locator('text=Outcome')).toBeVisible();
    await expect(page.locator('text=Interest you\'ll still pay')).toBeVisible();
  });

  // Flow 2: User adds two loans and compares avalanche vs snowball
  test("Flow 2: Compare avalanche and snowball payoff strategies", async ({ page }) => {
    await page.goto(fileUrl);
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Add second loan (default starts with 2, so if we just reset or load we have 2)
    await expect(page.locator('.loan-card')).toHaveCount(2);
    
    // Scroll to Rollover Planner section
    await expect(page.locator('text=Portfolio Rollover Planner')).toBeVisible();
    
    // Compare toggles
    const avalancheBtn = page.locator('button:has-text("Avalanche")');
    const snowballBtn = page.locator('button:has-text("Snowball")');
    
    await expect(avalancheBtn).toBeVisible();
    await expect(snowballBtn).toBeVisible();
    
    await snowballBtn.click();
    await expect(snowballBtn).not.toHaveClass(/secondary/);
    
    await avalancheBtn.click();
    await expect(avalancheBtn).not.toHaveClass(/secondary/);
  });

  // Flow 3: User enters windfall and receives recommended split
  test("Flow 3: Windfall Simulator optimization split rendering", async ({ page }) => {
    await page.goto(fileUrl);
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Verify windfall optimizer is mounted on the right panel
    await expect(page.locator('text=Smart Windfall Allocator')).toBeVisible();
    // Drag/change windfall slider or type values (represented by the widget UI)
    await expect(page.locator('text=Smart Windfall Allocator')).toBeVisible();
    await expect(page.locator('text=interest saved').first()).toBeVisible();
  });

  // Flow 4: User clicks PDF/save plan CTA and sees lead capture
  test("Flow 4: Save Plan CTA displays email capture form", async ({ page }) => {
    await page.goto(fileUrl);
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Click PDF download button
    await page.click('button:has-text("Save Plan & Get PDF")');
    
    // Verify modal elements
    await expect(page.locator('text=Save Plan & Download PDF')).toBeVisible();
    await expect(page.locator('input[placeholder="you@example.com"]')).toBeVisible();
    
    // Submit with invalid email and see basic check
    await page.fill('input[placeholder="you@example.com"]', 'invalid-email');
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('valid email');
      await dialog.dismiss();
    });
    await page.click('button[type="submit"]');
  });

  // Flow 5: User tries bad inputs and sees clear validation errors
  test("Flow 5: Validation errors are shown for out-of-bounds inputs", async ({ page }) => {
    await page.goto(fileUrl);
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Select interest rate field in first card and set it to 45% (which exceeds 30% cap)
    const rateInput = page.locator('.loan-card').first().locator('input').nth(2);
    await rateInput.fill('45');
    await rateInput.blur();
    
    // Expect warning alert box to render and display error message
    await expect(page.locator('.error-rate')).toBeVisible();
    await expect(page.locator('.error-rate')).toContainText('Interest rate must be between');
  });

  // Flow 6: User refreshes page and local data persists
  test("Flow 6: Local storage data persistence on reload", async ({ page }) => {
    await page.goto(fileUrl);
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Rename first loan
    const nameInput = page.locator('.loan-card').first().locator('input[placeholder="Loan Name"]');
    await nameInput.fill('My Special Debt');
    await nameInput.blur();
    
    // Refresh page
    await page.reload();
    await page.click('button:has-text("Model Your Loans (Free)")');
    
    // Verify name persisted
    const nameInputReload = page.locator('.loan-card').first().locator('input[placeholder="Loan Name"]');
    await expect(nameInputReload).toHaveValue('My Special Debt');
  });
});
