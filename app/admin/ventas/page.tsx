import { getSalesStats, getSales, getOpenClaims, getVendorsWithStats } from "@/lib/supabase/admin";
import SalesClient from "@/components/admin/SalesClient";

export const dynamic = "force-dynamic";

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; vendor?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const filters = { from: sp.from, to: sp.to, vendorId: sp.vendor, status: sp.status };

  const [stats, sales, claims, vendors] = await Promise.all([
    getSalesStats(filters),
    getSales(filters),
    getOpenClaims(),
    getVendorsWithStats(),
  ]);

  return (
    <SalesClient
      stats={stats}
      sales={sales}
      claims={claims}
      vendors={vendors.map((v) => ({ id: v.id, name: v.full_name }))}
      filters={{ from: sp.from, to: sp.to, vendor: sp.vendor, status: sp.status }}
    />
  );
}
