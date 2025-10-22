import StatsCard from "@/components/admin/StatsCard";
import { stats, mockProducts } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AdminDashboard() {
  const pendingProducts = mockProducts.filter(p => p.status === "pending");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bienvenido de vuelta, aquí tienes un resumen de REDY
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Productos Totales"
          value={stats.totalProducts}
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Pendientes de Aprobar"
          value={stats.pendingApproval}
          icon={Clock}
          className="border-orange-200 bg-orange-50"
        />
        <StatsCard
          title="Vendedores Activos"
          value={stats.activeVendors}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Ventas del Mes"
          value={formatPrice(stats.monthlySales)}
          icon={TrendingUp}
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Products */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Productos Pendientes</h2>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              {pendingProducts.length} nuevos
            </span>
          </div>

          <div className="space-y-4">
            {pendingProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-600">{product.seller}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatPrice(product.price)}</div>
                  <div className="text-xs text-gray-600">{product.category}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors">
            Ver todos los pendientes
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6">Actividad Reciente</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Producto aprobado</p>
                <p className="text-xs text-gray-600">
                  "Wetsuit Orca S7" fue aprobado y publicado
                </p>
                <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Nuevo vendedor</p>
                <p className="text-xs text-gray-600">
                  Carlos Ruiz se registró como vendedor
                </p>
                <p className="text-xs text-gray-400 mt-1">Hace 5 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Producto rechazado</p>
                <p className="text-xs text-gray-600">
                  "Bicicleta usada" no cumplió los requisitos
                </p>
                <p className="text-xs text-gray-400 mt-1">Hace 1 día</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Venta completada</p>
                <p className="text-xs text-gray-600">
                  Garmin Forerunner 945 - {formatPrice(280000)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}