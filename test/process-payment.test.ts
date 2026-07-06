import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock, createAuthMock } from './helpers/supabase';

// Mock del SDK de MercadoPago (Payment se instancia al importar la ruta)
const { mpCreate } = vi.hoisted(() => ({ mpCreate: vi.fn() }));
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(function () {
    return { create: mpCreate };
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { POST } from '@/app/api/mercadopago/process-payment/route';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const req = (body: any) => ({ json: async () => body }) as any;

const shipping = {
  address: 'Calle 1',
  city: 'Santiago',
  region: 'RM',
  phone: '+56900000000',
  rut: '11.111.111-1',
  notes: 'dejar en conserjería',
};

const paymentData = {
  payment_method_id: 'master',
  token: 'tok_123',
  installments: 1,
  email: 'buyer@test.cl',
  rut: '11.111.111-1',
};

function setup({ user = 'buyer-1', products, responses = {} }: any) {
  (createClient as any).mockResolvedValue(createAuthMock(user));
  const mock = createSupabaseMock({
    'products.select': { data: products, error: null },
    'orders.insert': { data: { id: 'order-1' }, error: null },
    'order_items.insert': { error: null },
    'orders.update': { error: null },
    'transactions.insert': { error: null },
    'products.update': { error: null },
    ...responses,
  });
  (createServiceClient as any).mockReturnValue(mock.client);
  return mock;
}

const approvedProduct = {
  id: 'p1',
  name: 'fafa',
  price: 66000,
  stock: 1,
  vendor_id: 'v1',
  approval_status: 'approved',
};

beforeEach(() => {
  vi.clearAllMocks();
  mpCreate.mockResolvedValue({ status: 'approved', id: 987654, payment_method_id: 'master' });
});

describe('process-payment · validación de entrada', () => {
  it('400 si no hay items', async () => {
    const res = await POST(req({ items: [], shipping, paymentData }));
    expect(res.status).toBe(400);
  });

  it('401 si el comprador no está autenticado', async () => {
    setup({ user: null, products: [approvedProduct] });
    const res = await POST(req({ items: [{ product_id: 'p1' }], shipping, paymentData }));
    expect(res.status).toBe(401);
  });

  it('400 si algún producto no existe', async () => {
    setup({ products: [] }); // pidieron 1 pero la DB devuelve 0
    const res = await POST(req({ items: [{ product_id: 'p1' }], shipping, paymentData }));
    expect(res.status).toBe(400);
  });

  it('409 si el producto no está aprobado o sin stock', async () => {
    setup({ products: [{ ...approvedProduct, approval_status: 'pending' }] });
    const res = await POST(req({ items: [{ product_id: 'p1' }], shipping, paymentData }));
    expect(res.status).toBe(409);
  });

  it('400 si hay más de un vendedor en la orden', async () => {
    setup({
      products: [
        approvedProduct,
        { ...approvedProduct, id: 'p2', vendor_id: 'v2' },
      ],
    });
    const res = await POST(
      req({ items: [{ product_id: 'p1' }, { product_id: 'p2' }], shipping, paymentData })
    );
    expect(res.status).toBe(400);
  });
});

describe('process-payment · pago aprobado', () => {
  it('recalcula el total desde la DB e ignora cualquier monto del cliente', async () => {
    const mock = setup({ products: [approvedProduct] });
    // El cliente intenta colar un total falso; la ruta no debe usarlo.
    await POST(
      req({ items: [{ product_id: 'p1' }], shipping, paymentData, total: 1, subtotal: 1 })
    );
    expect(mpCreate).toHaveBeenCalledTimes(1);
    const body = mpCreate.mock.calls[0][0].body;
    expect(body.transaction_amount).toBe(66000);

    const orderInsert = mock.calls.inserts.find((i) => i.table === 'orders')!;
    expect(orderInsert.payload.total).toBe(66000);
    expect(orderInsert.payload.commission_total).toBe(9900);
    expect(orderInsert.payload.buyer_id).toBe('buyer-1');
    expect(orderInsert.payload.status).toBe('pending');
  });

  it('crea la transacción en escrow (held) con montos correctos y descuenta stock', async () => {
    const mock = setup({ products: [approvedProduct] });
    const res = await POST(req({ items: [{ product_id: 'p1' }], shipping, paymentData }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.orderId).toBe('order-1');

    const tx = mock.calls.inserts.find((i) => i.table === 'transactions')!;
    expect(tx.payload).toMatchObject({
      order_id: 'order-1',
      vendor_id: 'v1',
      amount: 66000,
      commission: 9900,
      total: 66000,
      status: 'held',
    });

    const orderPaid = mock.calls.updates.find(
      (u) => u.table === 'orders' && u.payload.status === 'paid'
    );
    expect(orderPaid).toBeTruthy();

    const stockUpdate = mock.calls.updates.find((u) => u.table === 'products')!;
    expect(stockUpdate.payload.stock).toBe(0);
  });
});

describe('process-payment · pago rechazado', () => {
  it('cancela la orden y no crea transacción', async () => {
    mpCreate.mockResolvedValue({ status: 'rejected', id: 111, status_detail: 'cc_rejected' });
    const mock = setup({ products: [approvedProduct] });
    const res = await POST(req({ items: [{ product_id: 'p1' }], shipping, paymentData }));
    const json = await res.json();

    expect(json.success).toBe(false);
    const orderCancelled = mock.calls.updates.find(
      (u) => u.table === 'orders' && u.payload.status === 'cancelled'
    );
    expect(orderCancelled).toBeTruthy();
    expect(mock.calls.inserts.find((i) => i.table === 'transactions')).toBeUndefined();
  });
});
