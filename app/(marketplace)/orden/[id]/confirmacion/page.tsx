import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { CheckCircle, Package, MapPin, User, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ConfirmacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    notFound();
  }

  // Obtener orden
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("buyer_id", user.id)
    .single();

  if (error || !order) {
    console.error('Order not found:', error);
    notFound();
  }

  // Obtener vendedor
  const { data: vendor } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", order.vendor_id)
    .single();

  // Obtener items de la orden
  const { data: items } = await supabase
    .from("order_items")
    .select("*, product:products(name, images, condition)")
    .eq("order_id", id);

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Success header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Compra realizada con éxito!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu orden #{order.id.slice(0, 8)} ha sido confirmada
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 inline-block">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Próximos pasos:</strong>
              </p>
              <ol className="text-sm text-blue-700 text-left space-y-1">
                <li>1. El vendedor preparará tu pedido</li>
                <li>2. Te contactará para coordinar la entrega</li>
                <li>3. Una vez recibido, confirma en tu cuenta</li>
              </ol>
            </div>
          </div>

          {/* Detalles de la orden */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Info del vendedor */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Vendedor
              </h2>
              <p className="text-lg font-semibold mb-2">{vendor?.full_name || "Vendedor"}</p>
              <p className="text-sm text-gray-600">
                El vendedor te contactará pronto al teléfono que proporcionaste
              </p>
            </div>

            {/* Dirección de entrega */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Dirección de entrega
              </h2>
              <p className="text-gray-700 mb-1">{order.shipping_address}</p>
              <p className="text-gray-700">{order.shipping_city}, {order.shipping_region}</p>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos
            </h2>
            
            <div className="space-y-4">
              {items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product?.images?.[0] || ''}
                    alt={item.product?.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.product?.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      Estado: {item.product?.condition}
                    </p>
                    <p className="font-bold text-gray-900 mt-2">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comisión REDY</span>
                  <span className="font-semibold">{formatPrice(order.commission_total)}</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span>Total pagado</span>
                <span className="text-blue-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-yellow-900 mb-2">
              📦 Importante sobre tu compra
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• Tu dinero está protegido hasta que confirmes la recepción del producto</li>
              <li>• El vendedor te contactará en las próximas 24-48 horas</li>
              <li>• Coordina con el vendedor el método de entrega (pickup o envío)</li>
              <li>• Una vez recibido el producto, confirma la recepción en tu cuenta</li>
              <li>• Si hay algún problema, contáctanos inmediatamente</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-center transition-colors"
            >
              Seguir comprando
            </Link>
            <Link
              href="/"
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50 py-4 rounded-xl font-semibold text-center transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
  );
}