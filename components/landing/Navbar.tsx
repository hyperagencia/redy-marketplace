"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, Heart, ShoppingCart, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/context/CartContext";


export default function Navbar() {
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center font-bold text-xl text-white group-hover:scale-105 transition-transform">
              REDY
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              REDY
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#productos" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Productos
            </Link>
            <Link href="#categorias" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Categorías
            </Link>
            <Link href="#vender" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Vender
            </Link>
            <Link href="#nosotros" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Nosotros
            </Link>
          </div>


          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative">
              <Heart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <Link
              href="/carrito"
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link 
              href="/admin"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              <User className="w-5 h-5" />
              Ingresar
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link 
                href="#productos" 
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Productos
              </Link>
              <Link 
                href="#categorias" 
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Categorías
              </Link>
              <Link 
                href="#vender" 
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Vender
              </Link>
              <Link 
                href="#nosotros" 
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Nosotros
              </Link>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link 
  href="/login"
  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
>
  <User className="w-5 h-5" />
  Ingresar
</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}