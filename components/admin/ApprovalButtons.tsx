"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Loader2 } from "lucide-react";

interface ApprovalButtonsProps {
  productId: string;
  adminId: string;
}

export default function ApprovalButtons({ productId, adminId }: ApprovalButtonsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          approval_status: "approved",
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      alert("Error al aprobar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Debes proporcionar un motivo de rechazo");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          approval_status: "rejected",
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", productId);

      if (error) throw error;

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      alert("Error al rechazar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4">Acciones</h3>
        
        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Aprobar Producto
              </>
            )}
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            Rechazar Producto
          </button>
        </div>
      </div>

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Rechazar Producto</h3>
            
            <p className="text-gray-600 mb-4">
              Proporciona un motivo claro para que el vendedor pueda corregir el producto:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Ej: Las fotos no son claras, la descripción es insuficiente, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Rechazar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}