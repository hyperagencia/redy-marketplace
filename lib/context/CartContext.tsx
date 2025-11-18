"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image: string;
  condition: string;
  vendor_id: string;
  vendor_name: string;
}

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  addItem: (item: CartItem) => Promise<boolean>;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const supabase = createClient();

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("redy_cart");
    if (saved) {
      const parsed = JSON.parse(saved);
      setItems(parsed.items || []);
      setVendorId(parsed.vendorId || null);
      setVendorName(parsed.vendorName || null);
    }
  }, []);

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("redy_cart", JSON.stringify({ items, vendorId, vendorName }));
  }, [items, vendorId, vendorName]);

  // Agregar producto - Validar que sea del mismo vendedor
  const addItem = async (item: CartItem): Promise<boolean> => {
    // Si el carrito está vacío, permite agregar
    if (items.length === 0) {
      setItems([item]);
      setVendorId(item.vendor_id);
      setVendorName(item.vendor_name);
      return true;
    }

    // Si ya hay productos, verificar que sea del mismo vendedor
    if (vendorId !== item.vendor_id) {
      // Retornar false para mostrar modal de advertencia
      return false;
    }

    // Verificar si el producto ya está en el carrito
    const exists = items.find((i) => i.product_id === item.product_id);
    if (exists) {
      // Ya está en el carrito, no hacer nada
      return true;
    }

    // Agregar el producto
    setItems([...items, item]);
    return true;
  };

  const removeItem = (productId: string) => {
    const newItems = items.filter((item) => item.product_id !== productId);
    setItems(newItems);
    
    // Si no quedan items, limpiar el vendorId
    if (newItems.length === 0) {
      setVendorId(null);
      setVendorName(null);
    }
  };

  const clearCart = () => {
    setItems([]);
    setVendorId(null);
    setVendorName(null);
    localStorage.removeItem("redy_cart");
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        vendorId,
        vendorName,
        addItem,
        removeItem,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}