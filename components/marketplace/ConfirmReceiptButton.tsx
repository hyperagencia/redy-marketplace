"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

interface ConfirmReceiptButtonProps {
  orderId: string;
  status: string;
}

export default function ConfirmReceiptButton({ orderId, status }: ConfirmReceiptButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === "delivered") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <p className="text-sm text-green-800 font-medium">
          Recepción confirmada. El pago fue liberado al vendedor. ¡Gracias!
        </p>
      </div>
    );
  }

  // Solo se puede confirmar cuando el pago está acreditado
  if (status !== "paid") {
    return null;
  }

  const handleConfirm = async () => {
    if (!confirm("¿Confirmas que recibiste el producto en buen estado? Esto libera el pago al vendedor.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-receipt`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "No se pudo confirmar la recepción");
      }
      router.refresh();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <CheckCircle className="w-5 h-5" />
          Confirmar recepción del producto
        </>
      )}
    </button>
  );
}
