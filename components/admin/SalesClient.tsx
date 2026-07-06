"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import type { SaleRow } from "@/lib/supabase/admin";
import {
  DollarSign, TrendingUp, Wallet, Receipt, AlertTriangle, Loader2, Percent,
} from "lucide-react";

interface Stats {
  gmv: number; netRevenue: number; pendingPayout: number; count: number;
  aov: number; takeRate: number; commissionThisMonth: number; commissionPrevMonth: number;
}
interface Claim { id: string; order_id: string; reason: string; status: string; created_at: string; vendor_name: string | null }
interface Filters { from?: string; to?: string; vendor?: string; status?: string }
interface VendorOpt { id: string; name: string | null }

const payoutBadge: Record<string, string> = {
  held: "bg-gray-100 text-gray-700",
  released: "bg-orange-100 text-orange-700",
  paid_out: "bg-green-100 text-green-700",
};
const payoutLabel: Record<string, string> = {
  held: "Retenido", released: "Por pagar", paid_out: "Pagado",
};

export default function SalesClient({
  stats, sales, claims, vendors, filters,
}: {
  stats: Stats; sales: SaleRow[]; claims: Claim[]; vendors: VendorOpt[]; filters: Filters;
}) {
  const router = useRouter();
  const [f, setF] = useState<Filters>(filters);
  const [payingId, setPayingId] = useState<string | null>(null);

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (f.from) p.set("from", f.from);
    if (f.to) p.set("to", f.to);
    if (f.vendor) p.set("vendor", f.vendor);
    if (f.status) p.set("status", f.status);
    router.push(`/admin/ventas?${p.toString()}`);
  };

  // Saldo pendiente por vendedor (transacciones released sin pagar)
  const pendingByVendor = new Map<string, { name: string | null; amount: number }>();
  for (const s of sales) {
    if (s.payout_status === "released") {
      const cur = pendingByVendor.get(s.vendor_id) || { name: s.vendor_name, amount: 0 };
      cur.amount += s.vendor_amount;
      pendingByVendor.set(s.vendor_id, cur);
    }
  }
  const pendingVendors = [...pendingByVendor.entries()].sort((a, b) => b[1].amount - a[1].amount);

  const monthDelta = stats.commissionThisMonth - stats.commissionPrevMonth;

  const markPaid = async (vendorId: string) => {
    if (!confirm("¿Marcar como pagado todo el saldo pendiente de este vendedor?")) return;
    setPayingId(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/payout`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      router.refresh();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ventas</h1>
        <p className="text-gray-600">Control de caja, comisiones y pagos a vendedores</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Kpi label="GMV (ventas)" value={formatPrice(stats.gmv)} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} sub={`${stats.count} ventas`} />
        <Kpi label="Ingreso REDY (comisión)" value={formatPrice(stats.netRevenue)} icon={<DollarSign className="w-5 h-5 text-green-600" />} valueClass="text-green-600" sub={`Take rate ${(stats.takeRate * 100).toFixed(0)}%`} />
        <Kpi label="Saldo por pagar" value={formatPrice(stats.pendingPayout)} icon={<Wallet className="w-5 h-5 text-orange-600" />} valueClass="text-orange-600" sub="Pasivo con vendedores" />
        <Kpi label="Ticket promedio" value={formatPrice(stats.aov)} icon={<Receipt className="w-5 h-5 text-blue-600" />} sub={<span className="flex items-center gap-1"><Percent className="w-3 h-3" />Comisión mes: {formatPrice(stats.commissionThisMonth)} {monthDelta >= 0 ? "▲" : "▼"}</span>} />
      </div>

      {/* Alertas de reclamos */}
      {claims.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3 text-orange-900 font-bold">
            <AlertTriangle className="w-5 h-5" /> {claims.length} reclamo{claims.length !== 1 ? "s" : ""} abierto{claims.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {claims.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm bg-white rounded-xl px-4 py-3 border border-orange-100">
                <div>
                  <span className="font-semibold">Orden #{c.order_id.slice(0, 8)}</span>
                  <span className="text-gray-600"> · {c.vendor_name || "Vendedor"} · {c.reason}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(c.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Field label="Desde">
            <input type="date" value={f.from || ""} onChange={(e) => setF({ ...f, from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </Field>
          <Field label="Hasta">
            <input type="date" value={f.to || ""} onChange={(e) => setF({ ...f, to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </Field>
          <Field label="Vendedor">
            <select value={f.vendor || ""} onChange={(e) => setF({ ...f, vendor: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Todos</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name || v.id.slice(0, 8)}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select value={f.status || ""} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Todos</option>
              <option value="paid">Pagada</option>
              <option value="delivered">Entregada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </Field>
          <button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">Aplicar</button>
        </div>
      </div>

      {/* Payouts por vendedor */}
      {pendingVendors.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Pagos pendientes a vendedores</h2>
          <div className="space-y-3">
            {pendingVendors.map(([vendorId, info]) => (
              <div key={vendorId} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <div className="font-semibold">{info.name || "Vendedor"}</div>
                  <div className="text-sm text-gray-600">Por pagar: <span className="font-bold text-orange-600">{formatPrice(info.amount)}</span></div>
                </div>
                <button onClick={() => markPaid(vendorId)} disabled={payingId === vendorId} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {payingId === vendorId ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Marcar pagado
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Orden", "Fecha", "Vendedor", "Total", "Comisión", "Vendedor recibe", "Estado", "Pago"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((s) => (
                <tr key={s.transaction_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">
                    #{s.order_id?.slice(0, 8)}
                    {s.has_open_claim && <span title="Reclamo abierto" className="ml-2 inline-flex"><AlertTriangle className="w-4 h-4 text-orange-500 inline" /></span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{s.vendor_name || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(s.total)}</td>
                  <td className="px-4 py-3 text-sm text-green-700">{formatPrice(s.commission)}</td>
                  <td className="px-4 py-3 text-sm">{formatPrice(s.vendor_amount)}</td>
                  <td className="px-4 py-3 text-sm capitalize">{s.order_status}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${payoutBadge[s.payout_status]}`}>{payoutLabel[s.payout_status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length === 0 && (
          <div className="p-12 text-center text-gray-500">No hay ventas para los filtros seleccionados.</div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, sub, valueClass = "text-gray-900" }: { label: string; value: string; icon: React.ReactNode; sub?: React.ReactNode; valueClass?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{label}</div>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
