import { test, expect } from '@playwright/test'

test('login con email inexistente muestra un error y no navega', async ({ page }) => {
  await page.goto('/vi/')

  await page.locator('#email').fill('no-existe-esta-cuenta@ejemplo.com')
  await page.locator('#password').fill('cualquierPassword123')
  await page.locator('form').getByRole('button', { name: 'Ingresar' }).click()

  await expect(page.getByRole('alert')).toContainText('No existe una cuenta', { timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Ver sin cuenta' })).toBeVisible()
})
