import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/supabase/database";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, Clock, CheckCircle, XCircle, Plus, DollarSign, ShoppingBag } from "lucide-react"; // <- Agregar Plus aquí
import Link from "next/link";

export default async function VendedorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Obtener productos del vendedor
  const myProducts = await getProducts({ vendor: user?.id });

  // Obtener ventas del vendedor
const { data: orders } = await supabase
  .from("orders")
  .select("*, order_items(*)")
  .eq("vendor_id", user?.id);

const totalOrders = orders?.length || 0;
const pendingOrders = orders?.filter(o => o.status === "paid")?.length || 0;

const totalRevenue = orders?.reduce((sum, order) => {
  const items = order.order_items || [];
  const vendorAmount = items.reduce((itemSum: number, item: any) => 
    itemSum + (item.vendor_amount || 0), 0
  );
  return sum + vendorAmount;
}, 0) || 0;
  
  const pendingCount = myProducts.filter(p => p.approval_status === 'pending').length;
  const approvedCount = myProducts.filter(p => p.approval_status === 'approved').length;
  const rejectedCount = myProducts.filter(p => p.approval_status === 'rejected').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mis Productos
        </h1>
        <p className="text-gray-600">
          Gestiona tus productos y ventas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <div className="text-3xl font-bold">{myProducts.length}</div>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-orange-600">Pendientes</span>
          </div>
          <div className="text-3xl font-bold text-orange-700">{pendingCount}</div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600">Aprobados</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{approvedCount}</div>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-600">Rechazados</span>
          </div>
          <div className="text-3xl font-bold text-red-700">{rejectedCount}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-2xl text-white">
  <div className="flex items-center gap-3 mb-2">
    <ShoppingBag className="w-5 h-5" />
    <span className="text-sm text-blue-100">Ventas</span>
  </div>
  <div className="text-3xl font-bold">{totalOrders}</div>
  <p className="text-sm text-blue-100 mt-1">{pendingOrders} pendientes</p>
</div>

<div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-2xl text-white">
  <div className="flex items-center gap-3 mb-2">
    <DollarSign className="w-5 h-5" />
    <span className="text-sm text-green-100">Ingresos</span>
  </div>
  <div className="text-3xl font-bold">{formatPrice(totalRevenue)}</div>
  <p className="text-sm text-green-100 mt-1">Después de comisión</p>
</div>
      </div>

      {/* Agregar después de las 4 cards de productos */}


      {/* Products list */}
      {myProducts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{product.condition}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {product.approval_status === 'pending' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          Pendiente
                        </span>
                      )}
                      {product.approval_status === 'approved' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Aprobado
                        </span>
                      )}
                      {product.approval_status === 'rejected' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Rechazado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(product.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes productos todavía
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza subiendo tu primer producto
          </p>
          <Link
            href="/vendedor/nuevo"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Subir Producto
          </Link>
        </div>
      )}
    </div>
  );
}