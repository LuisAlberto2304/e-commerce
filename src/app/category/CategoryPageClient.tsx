'use client'

import { useState, useEffect } from "react";
import FiltersSidebar from "@/components/FiltersSidebar";
import ProductGridWithFilters from "@/components/ProductGridWithFilters";
export const revalidate = 120; // o 120

type Filters = { q?: string; color?: string; size?: string; category?: string };

export default function CategoryPageClient() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]); // Inicializar como array vacío
  const [filters, setFilters] = useState<Filters>({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        
        // Asegurarse de que data sea un array
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("❌ La respuesta de categorías no es un array:", data);
          setCategories([]);
        }
      } catch (error) {
        console.error("❌ Error cargando categorías:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  if (loadingCategories) return <div className="p-4">Cargando categorías...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <FiltersSidebar categories={categories} filters={filters} setFilters={setFilters} />
      <main className="flex-1 p-6">
        <ProductGridWithFilters filters={filters} setFilters={setFilters} />
      </main>
    </div>
  );
}