import { test, expect } from '@playwright/test'

test('guest login carga la biblioteca sembrada', async ({ page }) => {
  await page.goto('/vi/')

  await page.getByRole('button', { name: 'Ver sin cuenta' }).click()

  await expect(page.getByLabel(/Inception/i)).toBeVisible({ timeout: 15000 })
})
