import { createServiceClient } from './server';

/**
 * Capa de datos del ADMIN. Usa el cliente service-role (bypassa RLS) porque las
 * políticas de `orders` solo dejan ver al comprador/vendedor de cada orden.
 * Solo debe llamarse desde páginas/handlers ya protegidos como admin.
 */

const COMMISSION_RATE = 0.15;

// El pago al vendedor es amount - commission (85% del precio).
const vendorPayout = (t: { amount: number; commission: number }) =>
  Number(t.amount) - Number(t.commission);

// vendor_id apunta a auth.users; para el nombre consultamos profiles aparte.
async function vendorNameMap(
  s: ReturnType<typeof createServiceClient>,
  vendorIds: string[]
): Promise<Map<string, string | null>> {
  const ids = [...new Set(vendorIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const { data } = await s.from('profiles').select('id, full_name').in('id', ids);
  return new Map((data || []).map((p) => [p.id, p.full_name ?? null]));
}

export interface VendorStats {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  verified: boolean;
  blocked: boolean;
  created_at: string;
  products_count: number;
  gmv: number;
  commission_generated: number;
  pending_payout: number;
  paid_out: number;
  rating: number;
  reviews_count: number;
  open_claims: number;
}

export async function getVendorsWithStats(): Promise<VendorStats[]> {
  const s = createServiceClient();

  const [sellersRes, productsRes, txRes, reviewsRes, claimsRes, usersRes] =
    await Promise.all([
      s
        .from('profiles')
        .select('id, full_name, avatar_url, phone, verified, blocked, rating, created_at')
        .eq('role', 'seller'),
      s.from('products').select('vendor_id'),
      s.from('transactions').select('vendor_id, amount, commission, status, paid_out_at'),
      s.from('reviews').select('vendor_id, rating'),
      s.from('claims').select('vendor_id, status'),
      s.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  const emailById = new Map(
    (usersRes.data?.users || []).map((u) => [u.id, u.email ?? null])
  );

  const productCount = new Map<string, number>();
  for (const p of productsRes.data || [])
    productCount.set(p.vendor_id, (productCount.get(p.vendor_id) || 0) + 1);

  const money = new Map<
    string,
    { gmv: number; commission: number; pending: number; paid: number }
  >();
  for (const t of txRes.data || []) {
    const m = money.get(t.vendor_id) || { gmv: 0, commission: 0, pending: 0, paid: 0 };
    m.gmv += Number(t.amount);
    m.commission += Number(t.commission);
    if (t.status === 'released') {
      if (t.paid_out_at) m.paid += vendorPayout(t);
      else m.pending += vendorPayout(t);
    }
    money.set(t.vendor_id, m);
  }

  const ratings = new Map<string, { sum: number; n: number }>();
  for (const r of reviewsRes.data || []) {
    const a = ratings.get(r.vendor_id) || { sum: 0, n: 0 };
    a.sum += Number(r.rating);
    a.n += 1;
    ratings.set(r.vendor_id, a);
  }

  const openClaims = new Map<string, number>();
  for (const c of claimsRes.data || [])
    if (c.status === 'open' || c.status === 'in_review')
      openClaims.set(c.vendor_id, (openClaims.get(c.vendor_id) || 0) + 1);

  return (sellersRes.data || [])
    .map((v): VendorStats => {
      const m = money.get(v.id) || { gmv: 0, commission: 0, pending: 0, paid: 0 };
      const r = ratings.get(v.id);
      return {
        id: v.id,
        full_name: v.full_name,
        email: emailById.get(v.id) ?? null,
        phone: v.phone,
        avatar_url: v.avatar_url,
        verified: v.verified ?? false,
        blocked: v.blocked ?? false,
        created_at: v.created_at,
        products_count: productCount.get(v.id) || 0,
        gmv: m.gmv,
        commission_generated: m.commission,
        pending_payout: m.pending,
        paid_out: m.paid,
        rating: r ? r.sum / r.n : Number(v.rating) || 0,
        reviews_count: r?.n || 0,
        open_claims: openClaims.get(v.id) || 0,
      };
    })
    .sort((a, b) => b.gmv - a.gmv);
}

export interface SalesFilters {
  from?: string;
  to?: string;
  vendorId?: string;
  status?: string;
}

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function sumCommission(from: string, to: string): Promise<number> {
  const s = createServiceClient();
  const { data } = await s
    .from('transactions')
    .select('commission, created_at')
    .gte('created_at', from)
    .lt('created_at', to);
  return (data || []).reduce((sum, t) => sum + Number(t.commission), 0);
}

export async function getSalesStats(filters: SalesFilters = {}) {
  const s = createServiceClient();
  let q = s
    .from('transactions')
    .select('amount, commission, total, status, paid_out_at, vendor_id, created_at');
  if (filters.from) q = q.gte('created_at', filters.from);
  if (filters.to) q = q.lte('created_at', filters.to);
  if (filters.vendorId) q = q.eq('vendor_id', filters.vendorId);
  const { data: txs } = await q;

  const rows = txs || [];
  const gmv = rows.reduce((n, t) => n + Number(t.total), 0);
  const netRevenue = rows.reduce((n, t) => n + Number(t.commission), 0);
  const pendingPayout = rows
    .filter((t) => t.status === 'released' && !t.paid_out_at)
    .reduce((n, t) => n + vendorPayout(t), 0);
  const count = rows.length;

  const cur = monthRange(0);
  const prev = monthRange(-1);
  const [commissionThisMonth, commissionPrevMonth] = await Promise.all([
    sumCommission(cur.start, cur.end),
    sumCommission(prev.start, prev.end),
  ]);

  return {
    gmv,
    netRevenue,
    pendingPayout,
    count,
    aov: count ? Math.round(gmv / count) : 0,
    takeRate: gmv ? netRevenue / gmv : COMMISSION_RATE,
    commissionThisMonth,
    commissionPrevMonth,
  };
}

export interface SaleRow {
  order_id: string;
  transaction_id: string;
  created_at: string;
  vendor_id: string;
  vendor_name: string | null;
  order_status: string;
  total: number;
  commission: number;
  vendor_amount: number;
  payout_status: 'held' | 'released' | 'paid_out';
  has_open_claim: boolean;
}

export async function getSales(filters: SalesFilters = {}): Promise<SaleRow[]> {
  const s = createServiceClient();

  let q = s
    .from('transactions')
    .select(
      'id, amount, commission, total, status, paid_out_at, vendor_id, created_at, order:orders(id, status)'
    )
    .order('created_at', { ascending: false });
  if (filters.from) q = q.gte('created_at', filters.from);
  if (filters.to) q = q.lte('created_at', filters.to);
  if (filters.vendorId) q = q.eq('vendor_id', filters.vendorId);
  const { data: txs } = await q;

  const rows = (txs || []) as any[];

  // Nombres de vendedor (vendor_id apunta a auth.users, no a profiles → mapeo aparte)
  const vendorName = await vendorNameMap(s, rows.map((t) => t.vendor_id));

  // Reclamos abiertos por order_id
  const orderIds = rows.map((t) => t.order?.id).filter(Boolean);
  const claimByOrder = new Set<string>();
  if (orderIds.length) {
    const { data: claims } = await s
      .from('claims')
      .select('order_id, status')
      .in('order_id', orderIds);
    for (const c of claims || [])
      if (c.status === 'open' || c.status === 'in_review') claimByOrder.add(c.order_id);
  }

  return rows
    .filter((t) => (filters.status ? t.order?.status === filters.status : true))
    .map((t) => ({
      order_id: t.order?.id,
      transaction_id: t.id,
      created_at: t.created_at,
      vendor_id: t.vendor_id,
      vendor_name: vendorName.get(t.vendor_id) ?? null,
      order_status: t.order?.status ?? '—',
      total: Number(t.total),
      commission: Number(t.commission),
      vendor_amount: vendorPayout(t),
      payout_status: t.paid_out_at ? 'paid_out' : (t.status as 'held' | 'released'),
      has_open_claim: claimByOrder.has(t.order?.id),
    }));
}

/** Reclamos abiertos (para la alerta del admin). */
export async function getOpenClaims() {
  const s = createServiceClient();
  const { data } = await s
    .from('claims')
    .select('id, order_id, vendor_id, reason, description, status, created_at')
    .in('status', ['open', 'in_review'])
    .order('created_at', { ascending: false });
  const rows = data || [];
  const vendorName = await vendorNameMap(s, rows.map((c) => c.vendor_id));
  return rows.map((c) => ({ ...c, vendor_name: vendorName.get(c.vendor_id) ?? null }));
}
