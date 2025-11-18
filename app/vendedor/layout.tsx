import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Plus, TrendingUp, Settings, LogOut } from "lucide-react";
import LogoutButton from "@/components/vendedor/LogoutButton";

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Verificar que sea vendedor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center font-bold text-xl text-white">
              R
            </div>
            <div>
              <div className="font-bold text-lg">REDY</div>
              <div className="text-xs text-gray-500">Panel Vendedor</div>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/vendedor"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Mis Productos</span>
          </Link>
          <Link
            href="/vendedor/nuevo"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Subir Producto</span>
          </Link>
          <Link
            href="/vendedor/ventas"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Ventas</span>
          </Link>
          <Link
            href="/vendedor/configuracion"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configuración</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm text-white">
              {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {profile?.full_name || 'Vendedor'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user.email}
              </div>
            </div>
          </div>
          
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}