"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import ConfirmReceiptButton from "@/components/marketplace/ConfirmReceiptButton";
import {
  Package, User, Phone, Star, AlertTriangle, Loader2, CheckCircle, MessageCircle,
} from "lucide-react";

const statusInfo: Record<string, { label: string; className: string }> = {
  pending: { label: "Pago pendiente", className: "bg-gray-100 text-gray-700" },
  paid: { label: "Pagado · coordina la entrega", className: "bg-orange-100 text-orange-700" },
  delivered: { label: "Recibido", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
};

export default function OrderCard({
  order,
  hasReview,
  claimStatus,
}: {
  order: any;
  hasReview: boolean;
  claimStatus: string | null;
}) {
  const [modal, setModal] = useState<null | "rate" | "claim">(null);
  const items = order.order_items || [];
  const vendor = order.vendor;
  const st = statusInfo[order.status] || statusInfo.pending;
  const wa = vendor?.phone?.replace(/\+/g, "").replace(/\s/g, "");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">Orden</p>
            <p className="font-mono font-semibold">#{order.id.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fecha</p>
            <p className="font-semibold">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${st.className}`}>{st.label}</span>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-bold text-blue-600">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Productos</h3>
          <div className="space-y-3">
            {items.map((it: any) => (
              <div key={it.id} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.product?.images?.[0] || ""} alt={it.product?.name} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold text-sm">{it.product?.name}</p>
                  <p className="text-sm text-gray-600">{formatPrice(it.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendedor / contacto */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><User className="w-5 h-5" /> Vendedor</h3>
          <p className="font-semibold">{vendor?.full_name || "Vendedor"}</p>
          {vendor?.phone && (
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" /> {vendor.phone}
            </p>
          )}
          {wa && (order.status === "paid" || order.status === "delivered") && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
            >
              <MessageCircle className="w-4 h-4" /> Coordinar por WhatsApp
            </a>
          )}
          <p className="text-xs text-gray-500 mt-3">
            La entrega se coordina directamente con el vendedor (producto usado).
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-6 pb-6 space-y-3">
        {/* Marcar recibido (solo si pagado) / confirmado */}
        <ConfirmReceiptButton orderId={order.id} status={order.status} />

        {order.status === "delivered" && (
          <div className="flex flex-wrap gap-3">
            {hasReview ? (
              <span className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl">
                <Star className="w-4 h-4 fill-green-600 text-green-600" /> Ya puntuaste esta compra
              </span>
            ) : (
              <button onClick={() => setModal("rate")} className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                <Star className="w-4 h-4" /> Puntuar al vendedor
              </button>
            )}
            {renderClaimButton()}
          </div>
        )}
        {order.status === "paid" && <div className="flex">{renderClaimButton()}</div>}
      </div>

      {modal === "rate" && <RateModal orderId={order.id} onClose={() => setModal(null)} />}
      {modal === "claim" && <ClaimModal orderId={order.id} onClose={() => setModal(null)} />}
    </div>
  );

  function renderClaimButton() {
    if (claimStatus === "open" || claimStatus === "in_review") {
      return (
        <span className="inline-flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-4 py-2 rounded-xl">
          <AlertTriangle className="w-4 h-4" /> Reclamo en revisión
        </span>
      );
    }
    return (
      <button onClick={() => setModal("claim")} className="inline-flex items-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold">
        <AlertTriangle className="w-4 h-4" /> Presentar reclamo
      </button>
    );
  }
}

function RateModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating < 1) return alert("Selecciona una puntuación");
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      onClose();
      router.refresh();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Puntuar al vendedor" onClose={onClose}>
      <div className="flex gap-1 justify-center mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
            <Star className={`w-9 h-9 ${(hover || rating) >= n ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Cuéntanos cómo fue tu experiencia (opcional)"
        className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4"
      />
      <button onClick={submit} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Enviar puntuación
      </button>
    </Modal>
  );
}

function ClaimModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return alert("Selecciona un motivo");
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      onClose();
      router.refresh();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Presentar un reclamo" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Tu reclamo llegará al vendedor y al equipo de REDY para poder ayudarte.
      </p>
      <label className="block text-sm font-semibold mb-1">Motivo</label>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4">
        <option value="">Selecciona…</option>
        <option value="No recibí el producto">No recibí el producto</option>
        <option value="Producto distinto a lo publicado">Producto distinto a lo publicado</option>
        <option value="Producto dañado / con fallas">Producto dañado / con fallas</option>
        <option value="Problema con el vendedor">Problema con el vendedor</option>
        <option value="Otro">Otro</option>
      </select>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Describe lo que ocurrió"
        className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4"
      />
      <button onClick={submit} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />} Enviar reclamo
      </button>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
