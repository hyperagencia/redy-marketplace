import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Check, X, User, Package, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import ApprovalButtons from "@/components/admin/ApprovalButtons";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Obtener producto
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  // Obtener categoría
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", product.category_id)
    .single();

  // Obtener vendedor
  const { data: vendor } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", product.vendor_id)
    .single();

  // Obtener usuario admin actual
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <Link
        href="/admin/productos"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a productos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Galería */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Fotografías</h2>
            <div className="grid grid-cols-2 gap-4">
              {product.images?.map((img: string, index: number) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info del producto */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Información</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nombre</label>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Categoría</label>
                  <p>{category?.icon} {category?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Condición</label>
                  <p className="capitalize">{product.condition}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Precio</label>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(product.price)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Comisión: {formatPrice(product.price * 0.15)} | Vendedor recibe: {formatPrice(product.price * 0.85)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Descripción</label>
                <p className="whitespace-pre-line">{product.description}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Fecha</label>
                <p>{formatDate(product.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendedor */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4">Vendedor</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {vendor?.full_name?.[0] || "V"}
              </div>
              <div>
                <p className="font-semibold">{vendor?.full_name || "Vendedor"}</p>
                <p className="text-sm text-gray-600">{vendor?.products_count || 0} productos</p>
              </div>
            </div>
            {vendor?.verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✓ Verificado
              </div>
            )}
          </div>

          {/* Estado */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4">Estado</h3>
            {product.approval_status === "pending" && (
              <span className="px-3 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium inline-block">
                Pendiente
              </span>
            )}
            {product.approval_status === "approved" && (
              <span className="px-3 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium inline-block">
                Aprobado
              </span>
            )}
            {product.approval_status === "rejected" && (
              <span className="px-3 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium inline-block">
                Rechazado
              </span>
            )}
          </div>

          {/* Botones */}
          {product.approval_status === "pending" && user && (
            <ApprovalButtons productId={product.id} adminId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}