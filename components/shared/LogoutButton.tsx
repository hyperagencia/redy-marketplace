"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Botón de cerrar sesión reutilizable. `redirectTo` define a dónde ir tras salir
 * (por defecto la home). Estilo compacto para headers.
 */
export default function LogoutButton({
  redirectTo = "/",
  className = "",
}: {
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center gap-2 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 ${className}`}
    >
      <LogOut className="w-5 h-5" />
      {loading ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
