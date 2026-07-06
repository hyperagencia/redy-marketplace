import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock, createAuthMock } from './helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { POST } from '@/app/api/orders/[id]/confirm-receipt/route';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function setup({ user = 'buyer-1', order, responses = {} }: any) {
  (createClient as any).mockResolvedValue(createAuthMock(user));
  const mock = createSupabaseMock({
    'orders.select': { data: order, error: null },
    'orders.update': { error: null },
    'transactions.update': { error: null },
    ...responses,
  });
  (createServiceClient as any).mockReturnValue(mock.client);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('confirm-receipt', () => {
  it('401 si no hay sesión', async () => {
    setup({ user: null, order: null });
    const res = await POST({} as any, ctx('order-1') as any);
    expect(res.status).toBe(401);
  });

  it('404 si la orden es de otro comprador', async () => {
    setup({ user: 'buyer-1', order: { id: 'order-1', buyer_id: 'otro', status: 'paid' } });
    const res = await POST({} as any, ctx('order-1') as any);
    expect(res.status).toBe(404);
  });

  it('409 si la orden no está pagada', async () => {
    setup({ order: { id: 'order-1', buyer_id: 'buyer-1', status: 'pending' } });
    const res = await POST({} as any, ctx('order-1') as any);
    expect(res.status).toBe(409);
  });

  it('paid → delivered y libera el escrow (held → released)', async () => {
    const mock = setup({ order: { id: 'order-1', buyer_id: 'buyer-1', status: 'paid' } });
    const res = await POST({} as any, ctx('order-1') as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    const delivered = mock.calls.updates.find(
      (u) => u.table === 'orders' && u.payload.status === 'delivered'
    );
    expect(delivered).toBeTruthy();
    const released = mock.calls.updates.find(
      (u) => u.table === 'transactions' && u.payload.status === 'released'
    )!;
    expect(released).toBeTruthy();
    expect(released.payload.released_at).toBeTruthy();
  });

  it('idempotente: si ya está delivered responde ok sin actualizar', async () => {
    const mock = setup({ order: { id: 'order-1', buyer_id: 'buyer-1', status: 'delivered' } });
    const res = await POST({} as any, ctx('order-1') as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.alreadyConfirmed).toBe(true);
    expect(mock.calls.updates.length).toBe(0);
  });
});
