"use client";

import { motion } from "framer-motion";
import { categories } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export default function Categories() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
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
              key={category.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
            >
              {/* Icon */}
              <div className="text-5xl mb-4">{category.icon}</div>
              
              {/* Name */}
              <div className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                {category.name}
              </div>
              
              {/* Count */}
              <div className="text-sm text-gray-600">
                {category.count} productos
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}