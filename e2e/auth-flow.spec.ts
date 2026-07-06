import { test, expect } from '@playwright/test';
import {
  provisionPurchaseFixture,
  cleanupPurchaseFixture,
  hasServiceCreds,
  type TestFixture,
} from './helpers/provision';

/**
 * Verifica la fricción estilo MercadoLibre: explorar y armar carrito SIN login,
 * y que la cuenta se pide recién en el checkout. Además, que /login honra ?redirect=.
 */
test.describe('registro / fricción de compra', () => {
  let fx: TestFixture;

  test.beforeAll(async () => {
    test.skip(!hasServiceCreds(), 'Faltan credenciales service-role');
    fx = await provisionPurchaseFixture();
  });
  test.afterAll(async () => {
    if (fx) await cleanupPurchaseFixture(fx);
  });

  test('anónimo puede agregar al carrito; el gate está en el checkout', async ({ page }) => {
    await page.goto(`/productos/${fx.productId}`);
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.waitForURL('**/carrito');

    // El carrito se ve sin sesión y el "Continuar" lleva al login con redirect al checkout
    const cont = page.getByRole('link', { name: /Continuar con la compra/i });
    await expect(cont).toBeVisible();
    await expect(cont).toHaveAttribute('href', '/login?redirect=/checkout');
    await expect(page.getByText(/crea tu cuenta o inicia sesión/i)).toBeVisible();
  });

  test('/login honra ?redirect= y devuelve a la ruta indicada', async ({ page }) => {
    await page.goto('/login?redirect=/productos');
    await page.locator('#email').fill('cliente@redy.cl');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL((url) => url.pathname === '/productos');
    await expect(page).toHaveURL(/\/productos$/);
  });
});
