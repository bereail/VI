import { test, expect } from '@playwright/test'

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('buscar una película en TMDB y agregarla a la biblioteca', async ({ page }) => {
  await page.goto('/vi/')

  await page.getByRole('button', { name: 'Ver sin cuenta' }).click()
  await expect(page.getByLabel(/Inception/i)).toBeVisible({ timeout: 15000 })

  await page.getByRole('button', { name: 'Buscar en TMDB (B)' }).click()

  const searchPanel = page.locator('.modal-panel')
  const firstResult = searchPanel.locator('button').filter({ has: page.locator('img') }).first()
  await expect(firstResult).toBeVisible({ timeout: 15000 })

  const title = await firstResult.locator('img').first().getAttribute('alt')
  await firstResult.click()

  await expect(page.getByRole('heading', { name: 'Agregar película' })).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Agregar película', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Agregar película' })).not.toBeVisible({ timeout: 10000 })
  await expect(page.getByLabel(new RegExp(escapeRegex(title), 'i'))).toBeVisible({ timeout: 10000 })
})
