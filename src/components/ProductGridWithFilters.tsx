/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductGridWithFilters.tsx
"use client";
import { useEffect, useState } from "react";
import { fetchProducts } from "@/app/lib/medusaClient";
import { ProductCard } from "./ProductCard";

type ProductGridWithFiltersProps = {
  categoryId: string | null;
  filters: {
    q?: string;
    color?: string;
    size?: string;
  };
};

export default function ProductGridWithFilters({ 
  categoryId, 
  filters 
}: ProductGridWithFiltersProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos desde Medusa con TODOS los filtros
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Cargando productos con filtros:', { categoryId, ...filters });
        
        const data = await fetchProducts({ 
          categoryId: categoryId ?? undefined,
          q: filters.q,
          color: filters.color,
          size: filters.size,
          limit: 100 // Aumentar límite para mejor filtrado
        });
        
        setProducts(data.products || []);
        console.log('✅ Productos cargados exitosamente:', data.products?.length || 0);
      } catch (err: any) {
        console.error('❌ Error loading products:', err);
        setError(err.message || "No se pudieron obtener los productos");
      } finally {
        setLoading(false);
      }
    };

    // Debounce para evitar muchas llamadas rápidas
    const timeoutId = setTimeout(loadProducts, 300);
    
    return () => clearTimeout(timeoutId);
  }, [categoryId, filters.q, filters.color, filters.size]);

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

  const hasActiveFilters = categoryId || filters.q || filters.color || filters.size;
  const noResults = products.length === 0;

  return (
    <div>
      {/* Información del estado de filtros */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {noResults && hasActiveFilters ? (
            <span className="text-red-500">
              ❌ No hay productos que coincidan con los filtros aplicados.
            </span>
          ) : noResults ? (
            <span className="text-gray-500">
              📭 No hay productos disponibles.
            </span>
          ) : hasActiveFilters ? (
            <span className="text-green-600">
              ✅ Mostrando {products.length} productos filtrados.
            </span>
          ) : (
            <span className="text-gray-600">
              📦 Mostrando todos los {products.length} productos.
            </span>
          )}
        </p>
        
        {/* Mostrar filtros activos */}
        {hasActiveFilters && (
          <div className="mt-2 text-xs text-gray-500">
            <strong>Filtros activos:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {categoryId && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Categoría</span>}
              {filters.q && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Búsqueda: {filters.q}</span>}
              {filters.color && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Color: {filters.color}</span>}
              {filters.size && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Talla: {filters.size}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Grid de productos */}
      {noResults && hasActiveFilters ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
          <p className="text-gray-600 mb-4">
            Intenta con otros criterios de búsqueda o ajusta los filtros.
          </p>
        </div>
      ) : noResults ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay productos disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              title={prod.title}
              description={prod.description}
              imageUrl={prod.thumbnail}
              price={
                prod.variants?.[0]?.prices?.[0]
                  ? `$${(prod.variants[0].prices[0].amount / 100).toFixed(2)}`
                  : undefined
              }
              footerText="Entrega rápida 🚚"
              label="Nuevo"
            />
          ))}
        </div>
      )}
    </div>
  );
}