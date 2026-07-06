import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock } from './helpers/supabase';

const { mpGet } = vi.hoisted(() => ({ mpGet: vi.fn() }));
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(function () {
    return { get: mpGet };
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));

import { POST } from '@/app/api/mercadopago/webhook/route';
import { createServiceClient } from '@/lib/supabase/server';

const req = (body: any) =>
  ({
    url: 'http://localhost/api/mercadopago/webhook',
    json: async () => body,
  }) as any;

const paidOrder = {
  id: 'order-1',
  vendor_id: 'v1',
  subtotal: 66000,
  commission_total: 9900,
  total: 66000,
  status: 'pending',
  payment_id: '987654',
};

function setup(responses: any = {}) {
  const mock = createSupabaseMock({
    'orders.select': { data: paidOrder, error: null },
    'transactions.select': { data: null, error: null },
    'orders.update': { error: null },
    'transactions.insert': { error: null },
    'order_items.select': { data: [{ product_id: 'p1', products: { stock: 1 } }], error: null },
    'products.update': { error: null },
    ...responses,
  });
  (createServiceClient as any).mockReturnValue(mock.client);
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
  mpGet.mockResolvedValue({ status: 'approved', id: 987654 });
});

describe('webhook MercadoPago', () => {
  it('ignora notificaciones que no son de pago', async () => {
    const res = await POST(req({ type: 'test' }));
    expect(res.status).toBe(200);
    expect(mpGet).not.toHaveBeenCalled();
  });

  it('approved: crea transacción held, marca la orden paid y descuenta stock', async () => {
    const mock = setup();
    await POST(req({ type: 'payment', data: { id: '987654' } }));

    const tx = mock.calls.inserts.find((i) => i.table === 'transactions')!;
    expect(tx.payload).toMatchObject({
      order_id: 'order-1',
      vendor_id: 'v1',
      status: 'held',
      total: 66000,
    });
    const paid = mock.calls.updates.find(
      (u) => u.table === 'orders' && u.payload.status === 'paid'
    );
    expect(paid).toBeTruthy();
    const stock = mock.calls.updates.find((u) => u.table === 'products')!;
    expect(stock.payload.stock).toBe(0);
  });

  it('es idempotente: no reinserta transacción si ya existe', async () => {
    const mock = setup({ 'transactions.select': { data: { id: 'tx-existente' }, error: null } });
    await POST(req({ type: 'payment', data: { id: '987654' } }));
    expect(mock.calls.inserts.find((i) => i.table === 'transactions')).toBeUndefined();
    expect(mock.calls.updates.find((u) => u.table === 'products')).toBeUndefined();
  });

  it('rejected: cancela la orden si aún no estaba pagada', async () => {
    mpGet.mockResolvedValue({ status: 'rejected', id: 987654 });
    const mock = setup();
    await POST(req({ type: 'payment', data: { id: '987654' } }));
    const cancelled = mock.calls.updates.find(
      (u) => u.table === 'orders' && u.payload.status === 'cancelled'
    );
    expect(cancelled).toBeTruthy();
  });
});
