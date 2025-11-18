import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { 
  MapPin, 
  Shield, 
  Package, 
  Clock,
  ChevronRight,
  Heart,
  Share2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import ProductGallery from "@/components/product/ProductGallery";
import AddToCartButton from "@/components/product/AddToCartButton";
import SellerCard from "@/components/product/SellerCard";

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
    .eq("approval_status", "approved") // Solo productos aprobados
    .eq("available", true) // Solo disponibles
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

  // Productos similares del mismo vendedor
  const { data: similarProducts } = await supabase
    .from("products")
    .select("id, name, price, images, condition")
    .eq("vendor_id", product.vendor_id)
    .eq("approval_status", "approved")
    .eq("available", true)
    .neq("id", product.id)
    .limit(3);

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900">Inicio</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/?category=${category?.slug}`} className="hover:text-gray-900">
                {category?.name}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Columna izquierda - Galería */}
            <div className="lg:col-span-7">
              <ProductGallery images={product.images || []} productName={product.name} />
            </div>

            {/* Columna derecha - Info y compra */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                {/* Precio y título */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                      {product.condition}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      {category?.icon} {category?.name}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h1>

                  <div className="flex items-end gap-3 mb-2">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Publicado hace {formatDate(product.created_at)}
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3">
                  <AddToCartButton product={product} vendor={vendor}/>
                  
                  <button className="p-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Heart className="w-6 h-6 text-gray-600" />
                  </button>
                  
                  <button className="p-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Share2 className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Banner de marketplace */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 text-sm mb-1">
                        Compra protegida por REDY
                      </p>
                      <p className="text-xs text-blue-700">
                        Tu dinero está seguro hasta que confirmes que recibiste el producto
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info del vendedor */}
                <SellerCard vendor={vendor} productsCount={similarProducts?.length || 0} />

                {/* Detalles del producto */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Detalles del producto
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Estado</span>
                      <span className="font-semibold capitalize">{product.condition}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Categoría</span>
                      <span className="font-semibold">{category?.name}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Publicado</span>
                      <span className="font-semibold">{formatDate(product.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold mb-4">Descripción</h2>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Advertencia de marketplace */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-orange-900 mb-1">
                        Producto usado
                      </p>
                      <p className="text-orange-700">
                        Este producto ha sido utilizado. La condición reportada es "{product.condition}". 
                        Revisa bien las fotos y descripción antes de comprar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Productos similares del vendedor */}
          {similarProducts && similarProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">
                Más productos de {vendor?.full_name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {similarProducts.map((similar: any) => (
                  <Link
                    key={similar.id}
                    href={`/productos/${similar.id}`}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={similar.images?.[0] || ''}
                        alt={similar.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {similar.name}
                      </h3>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(similar.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}