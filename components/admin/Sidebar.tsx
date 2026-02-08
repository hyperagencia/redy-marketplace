"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Productos",
    href: "/admin/productos",
    icon: Package,
  },
  {
    name: "Vendedores",
    href: "/admin/vendedores",
    icon: Users,
  },
  {
    name: "Ventas",
    href: "/admin/ventas",
    icon: TrendingUp,
  },
  {
    name: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Obtener usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center p-1.5">
            <Image
              src="/assets/images/redy-icon.svg"
              alt="Redy Icon"
              width={40}
              height={40}
              className="w-full h-full"
            />
          </div>
          <div>
            <div className="font-bold text-lg">Redy</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-primary-500 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
              
              {isActive && (
                <ChevronRight className="w-4 h-4" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 mb-2">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center font-bold text-sm">
            {user?.email?.[0].toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {user?.user_metadata?.full_name || 'Admin'}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {user?.email || 'admin@redy.cl'}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">
            {loading ? 'Saliendo...' : 'Cerrar sesión'}
          </span>
        </button>
      </div>
    </aside>
  );
}