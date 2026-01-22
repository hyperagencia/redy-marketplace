"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link"; // Agregar al inicio

interface Product {
  id: string;
  name: string;
  price: number;
  condition: string;
  images: string[];
  category_id: string;
  stock: number;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  // Mostrar solo productos aprobados
  const approvedProducts = products.slice(0, 6);

  return (
    <section id="productos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Productos destacados
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Equipo deportivo verificado y de calidad
          </motion.p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {approvedProducts.map((product, index) => (
            <Link href={`/productos/${product.id}`} key={product.id}>
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                  alt={product.name}
                  fill
                  className={`object-cover group-hover:scale-105 transition-transform duration-300 ${product.stock <= 0 ? 'grayscale opacity-60' : ''}`}
                />

                {/* Out of Stock Overlay */}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-gray-900/90 text-white px-6 py-3 rounded-xl font-bold text-lg">
                      AGOTADO
                    </div>
                  </div>
                )}

                {/* Condition Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {product.condition}
                </div>

                {/* Favorite Button */}
                <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Name */}
                <h3 className="text-lg font-semibold mb-4 group-hover:text-primary-500 transition-colors line-clamp-2">
                  {product.name}
                </h3>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </div>
                  <button className="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-xl transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div> </Link>
          ))}
        </div>

        {/* View More Button */}
        {products.length > 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all">
              Ver todos los productos ({products.length})
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}