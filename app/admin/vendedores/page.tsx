"use client";

import { useState } from "react";
import { mockVendors } from "@/lib/mock-data";
import { formatPrice, formatDate } from "@/lib/utils";
import { 
  Mail,
  Phone,
  Package,
  TrendingUp,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Ban,
  UserCheck
} from "lucide-react";

export default function VendedoresPage() {
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendors = mockVendors
    .filter(v => filter === "all" ? true : v.status === filter)
    .filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      pending: "bg-orange-100 text-orange-700",
      suspended: "bg-red-100 text-red-700",
    };
    
    const labels = {
      active: "Activo",
      pending: "Pendiente",
      suspended: "Suspendido",
    };

    const icons = {
      active: CheckCircle,
      pending: AlertCircle,
      suspended: Ban,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Vendedores
        </h1>
        <p className="text-gray-600">
          Administra los vendedores registrados en REDY
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Vendedores</div>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{mockVendors.length}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Activos</div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {mockVendors.filter(v => v.status === "active").length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Pendientes</div>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {mockVendors.filter(v => v.status === "pending").length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Verificados</div>
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {mockVendors.filter(v => v.verified).length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filter === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filter === "pending"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter("suspended")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filter === "suspended"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Suspendidos
            </button>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVendors.map((vendor) => (
          <div 
            key={vendor.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={vendor.avatar}
                  alt={vendor.name}
                  className="w-16 h-16 rounded-full bg-gray-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{vendor.name}</h3>
                    {vendor.verified && (
                      <span title="Verificado">
  <CheckCircle className="w-5 h-5 text-blue-600" />
</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Mail className="w-4 h-4" />
                    {vendor.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </div>
                </div>
              </div>
              
              {getStatusBadge(vendor.status)}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Package className="w-4 h-4" />
                  Productos
                </div>
                <div className="text-2xl font-bold text-gray-900">{vendor.productsCount}</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Ventas
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(vendor.totalSales)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Star className="w-4 h-4" />
                  Rating
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {vendor.rating > 0 ? vendor.rating.toFixed(1) : "N/A"}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">Comisión</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatPrice(vendor.commission)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Registrado: {formatDate(vendor.joinedDate)}
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye className="w-5 h-5" />
                </button>
                {vendor.status === "active" && (
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Ban className="w-5 h-5" />
                  </button>
                )}
                {vendor.status === "pending" && (
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVendors.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron vendedores
          </h3>
          <p className="text-gray-600">
            Intenta cambiar los filtros o el término de búsqueda
          </p>
        </div>
      )}

      {/* Summary Footer */}
      {filteredVendors.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total vendedores</div>
              <div className="text-2xl font-bold text-gray-900">{filteredVendors.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total productos</div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredVendors.reduce((sum, v) => sum + v.productsCount, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total ventas</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(filteredVendors.reduce((sum, v) => sum + v.totalSales, 0))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total comisiones</div>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(filteredVendors.reduce((sum, v) => sum + v.commission, 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}