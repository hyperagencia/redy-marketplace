import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import OrderCard from "@/components/marketplace/account/OrderCard";
import LogoutButton from "@/components/shared/LogoutButton";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/cuenta");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, product:products(name, images)), vendor:profiles!orders_vendor_id_fkey(full_name, phone)"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const [{ data: reviews }, { data: claims }] = await Promise.all([
    supabase.from("reviews").select("order_id").eq("buyer_id", user.id),
    supabase.from("claims").select("order_id, status").eq("buyer_id", user.id),
  ]);

  const reviewed = new Set((reviews || []).map((r) => r.order_id));
  const claimByOrder = new Map((claims || []).map((c) => [c.order_id, c.status]));

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis compras</h1>
            <p className="text-gray-600">Sigue tus pedidos y coordina con el vendedor</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cuenta/perfil"
              className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-xl font-medium"
            >
              <User className="w-5 h-5" />
              Mi perfil
            </Link>
            <LogoutButton />
          </div>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <OrderCard
                key={order.id}
                order={order}
                hasReview={reviewed.has(order.id)}
                claimStatus={claimByOrder.get(order.id) ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Aún no tienes compras</h2>
            <p className="text-gray-600 mb-6">Explora el marketplace y encuentra tu próximo equipo.</p>
            <Link href="/productos" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold">
              Ver productos
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
