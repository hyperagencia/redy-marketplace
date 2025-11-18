"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Trash2, ShoppingBag, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/landing/Navbar";

export default function CarritoPage() {
  const { items, removeItem, clearCart, total, vendorName } = useCart();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirigir si no está autenticado
        router.push("/login?redirect=/carrito");
        return;
      }
      
      setUser(user);
      setLoading(false);
    }
    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  // Si no hay usuario, no renderizar nada (ya está redirigiendo)
  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Mi Carrito</h1>

          {items.length === 0 ? (
            // Carrito vacío
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-6">
                Explora nuestros productos y encuentra lo que necesitas
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Ver productos
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de productos */}
              <div className="lg:col-span-2 space-y-4">
                {/* Info del vendedor */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Compra única de:</strong> {vendorName}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Todos los productos son del mismo vendedor para facilitar el proceso
                  </p>
                </div>

                {/* Productos */}
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4"
                  >
                    <Link href={`/productos/${item.product_id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    </Link>
                    
                    <div className="flex-1">
                      <Link
                        href={`/productos/${item.product_id}`}
                        className="font-semibold text-lg hover:text-blue-600 block mb-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-600 capitalize mb-2">
                        Estado: {item.condition}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors h-fit"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                ))}

                {/* Botón limpiar carrito */}
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Vaciar carrito
                </button>
              </div>

              {/* Resumen */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-6">Resumen de compra</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({items.length} {items.length === 1 ? "producto" : "productos"})</span>
                      <span className="font-semibold">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Envío</span>
                      <span className="font-semibold">A coordinar</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 mb-4"
                  >
                    Continuar con la compra
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                      <Lock className="w-4 h-4" />
                      <span className="font-semibold">Compra segura</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Tu pago está protegido por REDY hasta que confirmes que recibiste el producto
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}