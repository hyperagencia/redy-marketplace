"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface CategoriesProps {
  categories: Category[];
  productCounts?: Record<string, number>;
}

export default function Categories({ categories, productCounts = {} }: CategoriesProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-neutral-200">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Explora por categoría
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Encuentra exactamente lo que necesitas
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all"
            >
              {/* Icon */}
              <div className="text-5xl mb-4">{category.icon}</div>

              {/* Name */}
              <div className="font-semibold text-lg mb-2 group-hover:text-primary-500 transition-colors">
                {category.name}
              </div>
              
              {/* Count */}
              <div className="text-sm text-gray-600">
                {productCounts[category.id] || 0} productos
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}