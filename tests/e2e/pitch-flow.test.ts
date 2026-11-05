import { test, expect } from '@playwright/test';

test.describe('Pitch flow', () => {
  test('should create a pitch, send it, and view analytics', async ({ page }) => {
    // Navigate to login (demo mode accepts any credentials)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (or onboarding first)
    await page.waitForURL('**/dashboard|**/onboarding');

    // If onboarding is shown, complete it
    if (page.url().includes('/onboarding')) {
      await page.fill('input[name="whatsapp"]', '+1 555 000 0000');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    }

    // Create a new pitch
    await page.click('text=New pitch');
    await page.fill('input[name="clientName"]', 'Test Client');
    await page.fill('textarea[name="brief"]', 'A small coffee shop downtown wants online table booking and a menu page.');
    await page.click('button:has-text("Generate pitch")');

    // Wait for generation to complete and redirect to edit page
    await page.waitForURL('**/pitch/*/edit');

    // Verify the review page loaded
    await expect(page.locator('h1')).toContainText('Test Client');

    // Send the pitch
    await page.click('button:has-text("Send to client")');

    // Verify sent state
    await expect(page.locator('text=Sent to')).toBeVisible();

    // Go to analytics
    await page.click('text=See who opened it');
    await page.waitForURL('**/analytics');

    // Verify analytics page loaded
    await expect(page.locator('h1')).toContainText('Test Client');
  });
});
