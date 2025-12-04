"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";

interface StockEditorProps {
  productId: string;
  currentStock: number;
}

export default function StockEditor({ productId, currentStock }: StockEditorProps) {
  const [stock, setStock] = useState(currentStock);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: stock })
        .eq('id', productId);

      if (error) throw error;

      alert('Stock actualizado correctamente');
      setEditing(false);
      router.refresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStock(currentStock);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5" />
        <h3 className="text-lg font-bold">Stock</h3>
      </div>

      {!editing ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            {stock > 0 ? (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-lg font-bold">
                {stock}
              </span>
            ) : (
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-lg font-bold">
                Agotado
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Editar stock
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
