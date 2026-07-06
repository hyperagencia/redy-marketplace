"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import type { VendorStats } from "@/lib/supabase/admin";
import {
  Mail, Phone, Package, TrendingUp, Star, CheckCircle, Ban, UserCheck,
  Search, AlertTriangle, Loader2, DollarSign,
} from "lucide-react";

export default function VendorsClient({ vendors }: { vendors: VendorStats[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      vendors
        .filter((v) =>
          filter === "all" ? true : filter === "blocked" ? v.blocked : !v.blocked
        )
        .filter((v) => {
          const q = searchTerm.toLowerCase();
          return (
            (v.full_name || "").toLowerCase().includes(q) ||
            (v.email || "").toLowerCase().includes(q)
          );
        }),
    [vendors, filter, searchTerm]
  );

  const toggleBlock = async (v: VendorStats) => {
    const action = v.blocked ? "reactivar" : "bloquear";
    if (!confirm(`¿Seguro que quieres ${action} a ${v.full_name || "este vendedor"}?`)) return;
    setLoadingId(v.id);
    try {
      const res = await fetch(`/api/admin/vendors/${v.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: !v.blocked }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      router.refresh();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const totalPendingPayout = vendors.reduce((s, v) => s + v.pending_payout, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Vendedores</h1>
        <p className="text-gray-600">Administra los vendedores registrados en REDY</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Vendedores" value={vendors.length} icon={<UserCheck className="w-5 h-5 text-blue-600" />} />
        <StatCard label="Activos" value={vendors.filter((v) => !v.blocked).length} icon={<CheckCircle className="w-5 h-5 text-green-600" />} valueClass="text-green-600" />
        <StatCard label="Bloqueados" value={vendors.filter((v) => v.blocked).length} icon={<Ban className="w-5 h-5 text-red-600" />} valueClass="text-red-600" />
        <StatCard label="Saldo por pagar" value={formatPrice(totalPendingPayout)} icon={<DollarSign className="w-5 h-5 text-blue-600" />} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "blocked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Activos" : "Bloqueados"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(v.full_name || "V")[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{v.full_name || "Sin nombre"}</h3>
                    {v.verified && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Mail className="w-4 h-4" />{v.email || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-4 h-4" />{v.phone || "—"}
                  </div>
                </div>
              </div>
              {v.blocked ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <Ban className="w-3 h-3" /> Bloqueado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" /> Activo
                </span>
              )}
            </div>

            {v.open_claims > 0 && (
              <div className="mb-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-sm text-orange-800">
                <AlertTriangle className="w-4 h-4" />
                {v.open_claims} reclamo{v.open_claims !== 1 ? "s" : ""} abierto{v.open_claims !== 1 ? "s" : ""}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <MiniStat icon={<Package className="w-4 h-4" />} label="Productos" value={String(v.products_count)} />
              <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="Ventas (GMV)" value={formatPrice(v.gmv)} />
              <MiniStat icon={<Star className="w-4 h-4" />} label="Rating" value={v.reviews_count ? `${v.rating.toFixed(1)} (${v.reviews_count})` : "N/A"} />
              <MiniStat icon={<DollarSign className="w-4 h-4" />} label="Comisión generada" value={formatPrice(v.commission_generated)} highlight />
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Saldo pendiente por pagar</div>
              <div className="text-lg font-bold text-blue-600">{formatPrice(v.pending_payout)}</div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">Registrado: {formatDate(v.created_at)}</div>
              <button
                onClick={() => toggleBlock(v)}
                disabled={loadingId === v.id}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  v.blocked
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {loadingId === v.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : v.blocked ? (
                  <><CheckCircle className="w-4 h-4" /> Reactivar</>
                ) : (
                  <><Ban className="w-4 h-4" /> Bloquear</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron vendedores</h3>
          <p className="text-gray-600">Ajusta los filtros o el término de búsqueda.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, valueClass = "text-gray-900" }: { label: string; value: string | number; icon: React.ReactNode; valueClass?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{label}</div>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function MiniStat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? "bg-blue-50" : "bg-gray-50"}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">{icon}{label}</div>
      <div className={`text-lg font-bold ${highlight ? "text-blue-600" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}
