import { test, expect } from '@playwright/test';
import {
  provisionPurchaseFixture,
  cleanupPurchaseFixture,
  hasServiceCreds,
  type TestFixture,
} from './helpers/provision';

/**
 * E2E de la compra completa usando el bypass de pago (NEXT_PUBLIC_MP_TEST_BYPASS=1).
 * Provisiona un comprador y un producto de prueba dedicados y los limpia al final,
 * así no toca el inventario ni los usuarios reales.
 */
test.describe('compra end-to-end', () => {
  let fx: TestFixture;

  test.beforeAll(async () => {
    test.skip(!hasServiceCreds(), 'Faltan credenciales service-role en .env.local');
    fx = await provisionPurchaseFixture();
  });

  test.afterAll(async () => {
    if (fx) await cleanupPurchaseFixture(fx);
  });

  test('login → carrito → checkout (bypass) → confirmar recepción', async ({ page }) => {
    // 1. Login por la UI
    await page.goto('/login');
    await page.locator('#email').fill(fx.email);
    await page.locator('#password').fill(fx.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL((url) => url.pathname !== '/login'); // comprador → /cuenta

    // 2. Producto → agregar al carrito (redirige a /carrito)
    await page.goto(`/productos/${fx.productId}`);
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.waitForURL('**/carrito');

    // 3. Ir al checkout
    await page.getByRole('link', { name: /Continuar con la compra/i }).click();
    await page.waitForURL('**/checkout');

    // 4. Datos de envío. Reintentamos el llenado hasta que los valores "peguen"
    //    (evita la carrera de hidratación de los inputs controlados de React).
    const rut = page.getByPlaceholder('12.345.678-9');
    await expect(rut).toBeVisible();
    // Llenar + avanzar en un solo bloque que reintenta hasta llegar al paso 2
    // (evita la carrera de hidratación de los inputs controlados de React).
    await expect(async () => {
      await rut.fill('11.111.111-1');
      await page.getByPlaceholder('Juan Pérez').fill('Comprador E2E');
      await page.getByPlaceholder('juan@ejemplo.cl').fill(fx.email);
      await page.getByPlaceholder('+56 9 1234 5678').fill('+56911112222');
      await page.locator('select').first().selectOption('Región Metropolitana');
      await page.getByPlaceholder('Santiago').fill('Santiago');
      await page.getByPlaceholder(/Av\. Providencia/i).fill('Av. Siempre Viva 742');
      await page.getByRole('button', { name: 'Continuar al pago' }).click();
      await expect(page.getByRole('heading', { name: 'Método de pago' })).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 25_000 });

    // 5. Simular pago aprobado (bypass) → confirmación
    const simular = page.getByRole('button', { name: /Simular pago aprobado/i });
    await expect(simular).toBeVisible({ timeout: 15_000 });
    await simular.click();
    await page.waitForURL('**/orden/**/confirmacion', { timeout: 20_000 });
    await expect(page.getByText('¡Compra realizada con éxito!')).toBeVisible();

    // 6. Confirmar recepción (libera el escrow)
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Confirmar recepción del producto/i }).click();
    await expect(page.getByText(/Recepción confirmada/i)).toBeVisible({ timeout: 15_000 });

    // 7. Verificación en DB: orden delivered, transacción released, stock 0
    const { data: orders } = await fx.admin
      .from('orders')
      .select('id, status')
      .eq('buyer_id', fx.buyerId);
    expect(orders?.[0]?.status).toBe('delivered');

    const { data: tx } = await fx.admin
      .from('transactions')
      .select('status')
      .eq('order_id', orders![0].id)
      .single();
    expect(tx?.status).toBe('released');

    const { data: product } = await fx.admin
      .from('products')
      .select('stock')
      .eq('id', fx.productId)
      .single();
    expect(product?.stock).toBe(0);
  });
});
