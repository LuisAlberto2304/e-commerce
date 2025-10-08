/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "@/app/lib/medusaClient";
import { ProductCard } from "./ProductCard";

type Filters = {
  q?: string;
  color?: string;
  size?: string;
  categories?: string[];
};


type ProductGridWithFiltersProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>; // Añadir esta prop
};

export default function ProductGridWithFilters({ filters, setFilters }: ProductGridWithFiltersProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => {
    const normalizedFilters = {
      q: filters.q?.trim() || undefined,
      color: filters.color?.trim() || undefined,
      size: filters.size?.trim() || undefined,
      categories: filters.categories?.length ? filters.categories : undefined,
    };

    console.log("🔄 Filtros normalizados:", normalizedFilters);
    return normalizedFilters;
  }, [filters.q, filters.color, filters.size, filters.categories]);


  useEffect(() => {
  let mounted = true;
  
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Enviando filtros a la API:", {
        categoryId: normalized.categories,
        q: normalized.q,
        color: normalized.color,
        size: normalized.size,
        limit: 100,
      });

      const data = await fetchProducts({
        categoryIds: normalized.categories,
        q: normalized.q,
        color: normalized.color,
        size: normalized.size,
        limit: 100,
      });


      if (!mounted) return;
      
      console.log("✅ Respuesta de la API:", {
        totalProducts: data.products?.length || 0,
        filtersApplied: normalized,
      });

      
      setProducts(data.products || []);
      if (data.products && data.products.length > 0) {
      console.log("🔍 Estructura del primer producto:", {
        id: data.products[0].id,
        title: data.products[0].title,
        category: data.products[0].category, // Ver si existe esta propiedad
        categories: data.products[0].categories, // O esta
        metadata: data.products[0].metadata, // O en metadata
      });
    }
      
    } catch (err: any) {
      console.error("❌ Error cargando productos:", err);
      if (mounted) {
        setError(err?.message || "Error al obtener productos");
        setProducts([]);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  };

  const timeoutId = setTimeout(loadProducts, 300);
  
  return () => {
    mounted = false;
    clearTimeout(timeoutId);
  };
}, [normalized]);

  // Función para limpiar filtros individuales
  const clearFilter = (filterKey: keyof Filters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  };

  const hasActiveFilters = Object.keys(normalized).some(key => normalized[key as keyof typeof normalized] !== undefined);
  const noResults = !loading && products.length === 0;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-lg mb-2">❌ Error</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Panel de estado y filtros activos */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {noResults && hasActiveFilters ? (
            <span className="text-red-500">❌ No hay productos que coincidan con los filtros.</span>
          ) : noResults ? (
            <span className="text-gray-500">📭 No hay productos disponibles.</span>
          ) : hasActiveFilters ? (
            <span className="text-green-600">✅ Mostrando {products.length} productos filtrados.</span>
          ) : (
            <span className="text-gray-600">📦 Mostrando todos los {products.length} productos.</span>
          )}
        </p>

        {hasActiveFilters && (
          <div className="mt-2 text-xs text-gray-500">
            <strong>Filtros activos:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {normalized.categories?.map((catId) => (
                <span
                  key={catId}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1"
                >
                  Categoría: {catId}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: prev.categories?.filter((id) => id !== catId),
                      }))
                    }
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}

              {normalized.q && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                  Búsqueda: {normalized.q}
                  <button 
                    onClick={() => clearFilter('q')}
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {normalized.color && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-1">
                  Color: {normalized.color}
                  <button 
                    onClick={() => clearFilter('color')}
                    className="text-purple-600 hover:text-purple-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {normalized.size && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                  Talla: {normalized.size}
                  <button 
                    onClick={() => clearFilter('size')}
                    className="text-orange-600 hover:text-orange-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid de productos */}
      {noResults ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
          <p className="text-gray-600 mb-4">Intenta con otros criterios o ajusta los filtros.</p>
          {hasActiveFilters && (
            <button 
              onClick={() => setFilters({})}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod: any) => {
            const getPrice = (product: any) => {
              const variant = product.variants?.[0] || {};
              
              // Intentar diferentes formas de obtener el precio
              if (variant.prices?.length > 0) {
                const price = variant.prices[0];
                return `$${(price.amount / 100).toFixed(2)}`;
              }
              if (variant.calculated_price) {
                return `$${(variant.calculated_price / 100).toFixed(2)}`;
              }
              if (variant.original_price) {
                return `$${(variant.original_price / 100).toFixed(2)}`;
              }
              if (product.variants?.[0]?.prices?.[0]?.amount) {
                return `$${(product.variants[0].prices[0].amount / 100).toFixed(2)}`;
              }
              
              return "—";
            };

            const productPrice = getPrice(prod);

            return (
              <ProductCard
                key={prod.id}
                id={prod.id}
                title={prod.title}
                description={prod.description}
                imageUrl={prod.thumbnail}
                price={productPrice}
                footerText="Entrega rápida 🚚"
                label="Nuevo"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}