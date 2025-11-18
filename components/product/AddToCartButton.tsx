"use client";

import { ShoppingCart, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/context/CartContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AddToCartButtonProps {
  product: any;
  vendor: any;
}

export default function AddToCartButton({ product, vendor }: AddToCartButtonProps) {
  const { addItem, vendorName, clearCart, itemCount } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAddToCart = async () => {
    setLoading(true);

    // Verificar si el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirigir al login
      router.push("/login?redirect=/productos/" + product.id);
      return;
    }

    const cartItem = {
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      condition: product.condition,
      vendor_id: product.vendor_id,
      vendor_name: vendor?.full_name || "Vendedor",
    };

    const success = await addItem(cartItem);

    if (!success) {
      // Mostrar modal de advertencia
      setShowModal(true);
    } else {
      // Mostrar feedback y redirigir al carrito
      setTimeout(() => {
        router.push("/carrito");
      }, 500);
    }

    setLoading(false);
  };

  const handleReplaceCart = async () => {
    clearCart();
    setShowModal(false);
    await handleAddToCart();
  };

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
      >
        <ShoppingCart className="w-5 h-5" />
        {loading ? "Agregando..." : "Agregar al carrito"}
      </button>

      {/* Modal de advertencia - Vendedor diferente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Productos de diferentes vendedores
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Ya tienes {itemCount} {itemCount === 1 ? "producto" : "productos"} de <strong>{vendorName}</strong> en tu carrito.
                </p>
                <p className="text-gray-600 text-sm">
                  Para mantener las compras simples y seguras, solo puedes comprar productos de un vendedor a la vez.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>¿Por qué?</strong> Así tienes un solo chat, un solo envío y un solo proceso de pago. Más simple para todos 🙂
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReplaceCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Vaciar carrito y agregar este producto
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full border-2 border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-semibold transition-colors"
              >
                Volver al carrito actual
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}