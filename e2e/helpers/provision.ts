import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Playwright no carga .env.local automáticamente; lo parseamos a mano.
function loadEnv(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    const env: Record<string, string> = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

export function hasServiceCreds() {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

export interface TestFixture {
  admin: SupabaseClient;
  email: string;
  password: string;
  buyerId: string;
  productId: string;
  price: number;
}

/**
 * Crea un comprador de prueba y un producto aprobado dedicado (bajo un vendedor
 * existente) para que el E2E de compra no consuma inventario real.
 */
export async function provisionPurchaseFixture(): Promise<TestFixture> {
  const admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Vendedor + categoría existentes para colgar el producto de prueba
  const { data: sample, error: sampleError } = await admin
    .from('products')
    .select('vendor_id, category_id')
    .limit(1)
    .single();
  if (sampleError || !sample) {
    throw new Error('No hay productos base para tomar vendor_id/category_id');
  }

  const price = 12345;
  const { data: product, error: productError } = await admin
    .from('products')
    .insert({
      vendor_id: sample.vendor_id,
      category_id: sample.category_id,
      name: `E2E Test Product ${Date.now()}`,
      description: 'Producto de prueba E2E — borrar si aparece.',
      price,
      condition: 'bueno',
      images: [
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      ],
      approval_status: 'approved',
      stock: 1,
      available: true,
    })
    .select()
    .single();
  if (productError || !product) {
    throw new Error(`No se pudo crear el producto de prueba: ${productError?.message}`);
  }

  const email = `e2e+${Date.now()}@redy.test`;
  const password = 'Password123!';
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError || !created?.user) {
    throw new Error(`No se pudo crear el comprador: ${userError?.message}`);
  }

  return { admin, email, password, buyerId: created.user.id, productId: product.id, price };
}

/** Borra todo lo creado por el fixture (órdenes, items, transacciones, producto, usuario). */
export async function cleanupPurchaseFixture(f: TestFixture) {
  const { admin, buyerId, productId } = f;
  const { data: orders } = await admin.from('orders').select('id').eq('buyer_id', buyerId);
  const orderIds = (orders || []).map((o) => o.id);
  if (orderIds.length) {
    await admin.from('transactions').delete().in('order_id', orderIds);
    await admin.from('order_items').delete().in('order_id', orderIds);
    await admin.from('orders').delete().in('id', orderIds);
  }
  await admin.from('products').delete().eq('id', productId);
  await admin.auth.admin.deleteUser(buyerId);
}
