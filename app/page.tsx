import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Categories from "@/components/landing/Categories";
import ProductGrid from "@/components/landing/ProductGrid";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        <Categories />
        <ProductGrid />
      </main>
    </>
  );
}