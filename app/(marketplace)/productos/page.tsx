import Hero from "@/components/landing/Hero";
import Categories from "@/components/landing/Categories";
import ProductGrid from "@/components/landing/ProductGrid";
import { getProducts, getCategories } from "@/lib/supabase/database";

export default async function ProductosPage() {
  // Obtener productos aprobados
  const allProducts = await getProducts({ status: 'approved' });

  // Obtener categorías
  const categories = await getCategories();

  // Contar productos por categoría
  const productCounts = allProducts.reduce((acc: Record<string, number>, product: any) => {
    if (product.category_id) {
      acc[product.category_id] = (acc[product.category_id] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <main className="min-h-screen">
      <Hero />
      <Categories categories={categories} productCounts={productCounts} />
      <ProductGrid products={allProducts} />
    </main>
  );
}
