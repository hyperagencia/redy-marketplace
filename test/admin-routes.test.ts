import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock } from './helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  requireAdmin: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { POST as blockPOST } from '@/app/api/admin/vendors/[id]/block/route';
import { POST as payoutPOST } from '@/app/api/admin/vendors/[id]/payout/route';
import { requireAdmin, createServiceClient } from '@/lib/supabase/server';

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (body: any) => ({ json: async () => body }) as any;

beforeEach(() => vi.clearAllMocks());

describe('POST /api/admin/vendors/[id]/block', () => {
  it('403 si no es admin', async () => {
    (requireAdmin as any).mockResolvedValue(null);
    const res = await blockPOST(req({ blocked: true }), ctx('v1') as any);
    expect(res.status).toBe(403);
  });

  it('admin bloquea al vendedor', async () => {
    (requireAdmin as any).mockResolvedValue({ id: 'admin-1' });
    const mock = createSupabaseMock({ 'profiles.update': { error: null } });
    (createServiceClient as any).mockReturnValue(mock.client);

    const res = await blockPOST(req({ blocked: true }), ctx('v1') as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    const upd = mock.calls.updates.find((u) => u.table === 'profiles')!;
    expect(upd.payload.blocked).toBe(true);
  });
});

describe('POST /api/admin/vendors/[id]/payout', () => {
  it('403 si no es admin', async () => {
    (requireAdmin as any).mockResolvedValue(null);
    const res = await payoutPOST(req({}), ctx('v1') as any);
    expect(res.status).toBe(403);
  });

  it('marca pagadas las transacciones released pendientes', async () => {
    (requireAdmin as any).mockResolvedValue({ id: 'admin-1' });
    const mock = createSupabaseMock({
      'transactions.update': { data: [{ id: 't1' }, { id: 't2' }], error: null },
    });
    (createServiceClient as any).mockReturnValue(mock.client);

    const res = await payoutPOST(req({}), ctx('v1') as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.paid).toBe(2);
    const upd = mock.calls.updates.find((u) => u.table === 'transactions')!;
    expect(upd.payload.paid_out_at).toBeTruthy();
  });
});
