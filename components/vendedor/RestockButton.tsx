"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface RestockButtonProps {
  productId: string;
  currentStock: number;
  productName: string;
}

export default function RestockButton({ productId, currentStock, productName }: RestockButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRestock = async () => {
    if (!confirm(`¿Volver a poner en venta "${productName}"?`)) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: 1 })
        .eq('id', productId);

      if (error) throw error;

      alert('Producto vuelto a poner en venta exitosamente');
      router.refresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentStock > 0) {
    return null; // No mostrar botón si hay stock
  }

  return (
    <button
      onClick={handleRestock}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RotateCcw className="w-4 h-4" />
      {loading ? "Actualizando..." : "Volver a venta"}
    </button>
  );
}
