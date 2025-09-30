"use client";

import { useState, useEffect } from "react";
import FiltersSidebar from "@/components/FiltersSidebar";
import ProductGridWithFilters from "@/components/ProductGridWithFilters";

// Función para obtener categorías
const fetchCategories = async () => {
  try {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Error fetching categories");
    return await res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export default function CategoryPageClient() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ q?: string; color?: string; size?: string }>({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  if (loadingCategories) {
    return <div className="p-4">Cargando categorías...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <FiltersSidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        setFilters={setFilters}
        currentFilters={filters}
      />
      
      <main className="flex-1 p-6">
        <ProductGridWithFilters 
          categoryId={selectedCategoryId}
          filters={filters}
        />
      </main>
    </div>
  );
}
