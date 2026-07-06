import { getVendorsWithStats } from "@/lib/supabase/admin";
import VendorsClient from "@/components/admin/VendorsClient";

export const dynamic = "force-dynamic";

export default async function VendedoresPage() {
  const vendors = await getVendorsWithStats();
  return <VendorsClient vendors={vendors} />;
}
