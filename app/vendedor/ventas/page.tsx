import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingBag, DollarSign, Clock, CheckCircle, Package, MapPin, User, Phone } from "lucide-react";
import Link from "next/link";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Obtener todas las órdenes del vendedor
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(*, product:products(name, images)),
      buyer:profiles!orders_buyer_id_fkey(full_name, phone, email)
    `)
    .eq("vendor_id", user?.id)
    .order("created_at", { ascending: false });

  // Calcular estadísticas
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === "paid")?.length || 0;
  const completedOrders = orders?.filter(o => o.status === "completed")?.length || 0;

  // Calcular ingresos
  const totalRevenue = orders?.reduce((sum, order) => {
    const items = order.order_items || [];
    const vendorAmount = items.reduce((itemSum: number, item: any) => 
      itemSum + (item.vendor_amount || 0), 0
    );
    return sum + vendorAmount;
  }, 0) || 0;

  const pendingRevenue = orders
    ?.filter(o => o.status === "paid")
    ?.reduce((sum, order) => {
      const items = order.order_items || [];
      const vendorAmount = items.reduce((itemSum: number, item: any) => 
        itemSum + (item.vendor_amount || 0), 0
      );
      return sum + vendorAmount;
    }, 0) || 0;

  const availableRevenue = orders
    ?.filter(o => o.status === "completed")
    ?.reduce((sum, order) => {
      const items = order.order_items || [];
      const vendorAmount = items.reduce((itemSum: number, item: any) => 
        itemSum + (item.vendor_amount || 0), 0
      );
      return sum + vendorAmount;
    }, 0) || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Ventas</h1>
        <p className="text-gray-600">Gestiona tus ventas y pagos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Ventas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Ventas Totales</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalOrders}</div>
          <p className="text-sm text-gray-600 mt-1">
            {pendingOrders} pendientes • {completedOrders} completadas
          </p>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-700">Ingresos Totales</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{formatPrice(totalRevenue)}</div>
          <p className="text-sm text-green-600 mt-1">
            (Después de comisión REDY 15%)
          </p>
        </div>

        {/* Pagos Pendientes */}
        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-700">Por Confirmar</span>
          </div>
          <div className="text-3xl font-bold text-orange-700">{formatPrice(pendingRevenue)}</div>
          <p className="text-sm text-orange-600 mt-1">
            Esperando confirmación del comprador
          </p>
        </div>

        {/* Pagos Disponibles */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-700">Disponible</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{formatPrice(availableRevenue)}</div>
          <p className="text-sm text-blue-600 mt-1">
            Listo para transferir
          </p>
        </div>
      </div>

      {/* Info importante */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 text-sm mb-1">
              ¿Cuándo recibo mi dinero?
            </h3>
            <p className="text-sm text-yellow-800">
              Los pagos se liberan cuando el comprador confirma que recibió el producto. 
              Una vez confirmado, el dinero estará disponible en tu cuenta REDY y podrás solicitar la transferencia.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order: any) => {
            const items = order.order_items || [];
            const vendorTotal = items.reduce((sum: number, item: any) => 
              sum + (item.vendor_amount || 0), 0
            );

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Orden</p>
                        <p className="font-mono font-semibold">#{order.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha</p>
                        <p className="font-semibold">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Estado de la orden */}
                      {order.status === "paid" && (
                        <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                          ⏳ Pendiente de entrega
                        </span>
                      )}
                      {order.status === "completed" && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          ✓ Completada
                        </span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          ✕ Cancelada
                        </span>
                      )}

                      {/* Tu ganancia */}
                      <div className="bg-blue-50 px-4 py-2 rounded-full">
                        <p className="text-xs text-blue-600 font-medium">Tu ganancia</p>
                        <p className="text-lg font-bold text-blue-700">{formatPrice(vendorTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Productos */}
                    <div className="lg:col-span-2">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Productos vendidos
                      </h3>
                      <div className="space-y-3">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.product?.images?.[0] || ''}
                              alt={item.product?.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{item.product?.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Precio: {formatPrice(item.price)}</span>
                                <span>•</span>
                                <span>Comisión: {formatPrice(item.commission_amount)}</span>
                                <span>•</span>
                                <span className="font-semibold text-green-700">
                                  Recibes: {formatPrice(item.vendor_amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info del comprador y envío */}
                    <div className="space-y-4">
                      {/* Comprador */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Comprador
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold">{order.buyer?.full_name}</p>
                          <p className="text-gray-600 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {order.shipping_phone}
                          </p>
                          <p className="text-gray-600">{order.buyer?.email}</p>
                        </div>
                      </div>

                      {/* Dirección de envío */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Dirección de envío
                        </h3>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>{order.shipping_address}</p>
                          <p>{order.shipping_city}, {order.shipping_region}</p>
                          {order.buyer_notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="font-semibold text-gray-900 mb-1">Notas:</p>
                              <p className="text-gray-600">{order.buyer_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RUT del comprador */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-bold mb-2 text-sm">RUT Comprador</h3>
                        <p className="font-mono text-sm">{order.buyer_rut}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer con acciones */}
                {order.status === "paid" && (
                  <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Contacta al comprador para coordinar la entrega
                        </span>
                      </div>
                      
                      <a
                        href={`https://wa.me/${order.shipping_phone?.replace(/\+/g, '').replace(/\s/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Contactar por WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes ventas todavía
            </h3>
            <p className="text-gray-600 mb-6">
              Cuando alguien compre tus productos, aparecerán aquí
            </p>
            <Link
              href="/vendedor"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Ver mis productos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}