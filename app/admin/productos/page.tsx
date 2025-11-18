import { getProducts } from "@/lib/supabase/database";
import { formatPrice, formatDate } from "@/lib/utils";
import { 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  Search,
  Package
} from "lucide-react";
import Link from "next/link";

export default async function ProductosPage() {
  // Obtener todos los productos
  const allProducts = await getProducts();
  const pendingProducts = await getProducts({ status: 'pending' });
  const approvedProducts = await getProducts({ status: 'approved' });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Productos
        </h1>
        <p className="text-gray-600">
          Revisa y aprueba productos subidos por los vendedores
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold">{allProducts.length}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="text-sm text-orange-600 mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-orange-700">{pendingProducts.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="text-sm text-green-600 mb-1">Aprobados</div>
          <div className="text-2xl font-bold text-green-700">{approvedProducts.length}</div>
        </div>
      </div>

      {/* Products Table */}
      {allProducts.length > 0 ? (
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </Link>
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
            No hay productos todavía
          </h3>
          <p className="text-gray-600">
            Los productos aparecerán aquí cuando los vendedores los suban
          </p>
        </div>
      )}
    </div>
  );
}