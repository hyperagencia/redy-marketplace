"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    badge: 12,
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

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
            R
          </div>
          <div>
            <div className="font-bold text-lg">REDY</div>
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
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
              
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
              
              {isActive && (
                <ChevronRight className="w-4 h-4" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
            LA
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Luis Admin</div>
            <div className="text-xs text-gray-400">admin@redy.cl</div>
          </div>
        </div>
        
        <button className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}