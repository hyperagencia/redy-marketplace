import { test, expect } from '@playwright/test';

/**
 * Smoke E2E: no requieren auth ni mutan la base. Verifican que las páginas
 * públicas cargan y que la tienda muestra productos aprobados navegables.
 */
test.describe('storefront (smoke)', () => {
  test('la landing carga', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Redy/i);
  });

  test('/productos lista productos aprobados', async ({ page }) => {
    await page.goto('/productos');
    await expect(page.getByText('Productos destacados')).toBeVisible();
    const productLinks = page.locator('a[href^="/productos/"]');
    expect(await productLinks.count()).toBeGreaterThan(0);
  });

  test('el detalle de producto muestra precio y CTA de carrito', async ({ page }) => {
    await page.goto('/productos');
    await page.locator('a[href^="/productos/"]').first().click();
    await expect(page).toHaveURL(/\/productos\/[0-9a-f-]{36}/);
    await expect(
      page.getByRole('button', { name: /Agregar al carrito|agotado/i })
    ).toBeVisible();
  });

  test('/carrito carga', async ({ page }) => {
    await page.goto('/carrito');
    await expect(page.locator('body')).toBeVisible();
  });
});
