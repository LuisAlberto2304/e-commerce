/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "@/app/lib/medusaClient"; // Keep? Linter said unused. Let's inspect line 4 usage. Importer said unused. Removing.
import { ProductCard } from "./ProductCard";
import { Product } from "@/app/types/newProduct";
import { useInfiniteProducts } from "@/hooks/useProductsQuery";
import { Filters } from "@/app/types/filters";
import { useProductRatings } from "@/hooks/useProductRatings"; // 🔹 Nuevo hook
import {
  normalizeColors,
  normalizeSizes,
  extractColorsFromVariantTitle,
  extractColorsFromText,
  extractSizesFromText,
} from "@/utils/productUtils";

type ProductGridWithFiltersProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onProductsLoad?: (products: any[]) => void; // Nueva prop
};

export default function ProductGridWithFilters({
  filters,
  setFilters,
  onProductsLoad
}: ProductGridWithFiltersProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const { ratings, loading: ratingsLoading } = useProductRatings();
  const {
    data,
    isLoading: loading,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProducts(filters);

  const error = queryError ? (queryError as Error).message : null;

  // Flatten all pages into a single array of products
  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) || [];
  }, [data]);

  // Update parent component if needed
  useEffect(() => {
    if (onProductsLoad) {
      onProductsLoad(allProducts);
    }
  }, [allProducts, onProductsLoad]);

  const getProductPriceNumber = (product: Product): number | null => {
    const variant = product.variants?.[0];
    if (!variant || !variant.prices?.length) return null;

    // Priorizar MXN
    const mxnPrice = variant.prices.find(p => p.currency_code === 'mxn');
    if (mxnPrice) return mxnPrice.amount / 100;

    // Fallback a USD
    const usdPrice = variant.prices.find(p => p.currency_code === 'usd');
    if (usdPrice) return usdPrice.amount / 100;

    // Último recurso: primer precio disponible
    return variant.prices[0].amount / 100;
  };



  // Filtrar productos - VERSIÓN MEJORADA con colores reales
  const filteredProducts = useMemo(() => {
    if (!allProducts.length) return [];

    let filtered = [...allProducts];
    // console.log("🔄 Iniciando filtrado REAL por variantes...", { filters });

    // Filtros básicos (búsqueda y categorías)
    if (filters.q) {
      const query = filters.q.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    if (filters.categories?.length) {
      filtered = filtered.filter(product =>
        product.categories?.some((cat: any) =>
          filters.categories?.includes(cat.id)
        )
      );
    }

    // FILTRO POR TALLA - FUNCIONAL
    if (filters.size?.length) {
      const before = filtered.length;
      filtered = filtered.filter(product => {
        const hasSize = product.variants?.some((variant: any) => {
          const variantTitle = variant.title?.toLowerCase() || '';
          return filters.size?.some(size =>
            variantTitle.includes(size.toLowerCase())
          );
        });

        if (!hasSize) {
          console.log(`❌ Producto "${product.title}" NO tiene talla:`, filters.size);
        }
        return hasSize;
      });
      console.log(`📏 Filtro tallas ${filters.size}: ${before} → ${filtered.length}`);
    }

    // FILTRO POR PRECIO
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const before = filtered.length;

      filtered = filtered.filter(product => {
        const productPrice = getProductPriceNumber(product);

        if (productPrice === null) return false;

        const meetsMinPrice = filters.minPrice === undefined || productPrice >= filters.minPrice;
        const meetsMaxPrice = filters.maxPrice === undefined || productPrice <= filters.maxPrice;

        return meetsMinPrice && meetsMaxPrice;
      });

      console.log(`💰 Filtro precio ${filters.minPrice || 0}-${filters.maxPrice || '∞'}: ${before} → ${filtered.length}`);
    }

    // 🔹 FILTRO POR RATING - VERSIÓN CORREGIDA
    if (filters.rating && !ratingsLoading) {
      const before = filtered.length;
      console.log(`⭐ APLICANDO FILTRO RATING: ${filters.rating}+ estrellas`);

      filtered = filtered.filter(product => {
        const productRating = ratings[product.id]?.averageRating || 0;
        const passesFilter = productRating >= filters.rating!;

        // Debug individual
        if (before <= 10) { // Solo debug para pocos productos
          console.log(`   ${product.title}: ${productRating} estrellas → ${passesFilter ? '✅' : '❌'}`);
        }

        return passesFilter;
      });

      console.log(`⭐ Resultado filtro rating: ${before} → ${filtered.length}`);

    }

    // FILTRO POR COLOR - CON NORMALIZACIÓN
    if (filters.color?.length) {
      const before = filtered.length;

      // Normalizar los colores del filtro
      const normalizedFilterColors = normalizeColors(filters.color);

      filtered = filtered.filter(product => {
        const hasColor = product.variants?.some((variant: any) => {
          const variantTitle = variant.title || '';
          const variantSku = variant.sku || '';

          // Extraer y normalizar colores del producto
          const colorsInTitle = extractColorsFromVariantTitle(variantTitle);
          const colorsInSku = extractColorsFromText(variantSku);
          const allProductColors = normalizeColors([...colorsInTitle, ...colorsInSku]);

          // Verificar si alguno de los colores del filtro coincide
          return normalizedFilterColors.some(filterColor =>
            allProductColors.some(productColor =>
              productColor.toLowerCase() === filterColor.toLowerCase()
            )
          );
        });

        return hasColor;
      });

      console.log(`🎨 Filtro colores ${normalizedFilterColors.join(', ')}: ${before} → ${filtered.length}`);
    }

    // FILTRO POR TALLA - CON NORMALIZACIÓN
    if (filters.size?.length) {
      const before = filtered.length;

      // Normalizar las tallas del filtro
      const normalizedFilterSizes = normalizeSizes(filters.size);

      filtered = filtered.filter(product => {
        const hasSize = product.variants?.some((variant: any) => {
          const variantTitle = variant.title || '';
          const productSizes = normalizeSizes(extractSizesFromText(variantTitle));

          return normalizedFilterSizes.some(filterSize =>
            productSizes.some(productSize =>
              productSize === filterSize
            )
          );
        });

        return hasSize;
      });

      console.log(`📏 Filtro tallas ${normalizedFilterSizes.join(', ')}: ${before} → ${filtered.length}`);
    }

    return filtered;
  }, [allProducts, filters]);



  // Actualizar productos cuando cambian los filtros
  useEffect(() => {
    setProducts(filteredProducts);
  }, [filteredProducts]);

  // Función para limpiar filtros individuales
  const clearFilter = (filterKey: keyof Filters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  };

  const clearArrayFilter = (filterKey: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: (prev[filterKey] as string[]).filter(item => item !== value)
    }));
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof Filters];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });

  const noResults = !loading && products.length === 0;

  if (loading && allProducts.length === 0) {
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
              {filters.categories?.map((catId: string) => (
                <span
                  key={catId}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1"
                >
                  Categoría: {catId}
                  <button
                    onClick={() => clearArrayFilter('categories', catId)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}

              {filters.q && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                  Búsqueda: {filters.q}
                  <button
                    onClick={() => clearFilter('q')}
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.color?.map((color: string) => (
                <span key={color} className="bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-1">
                  Color: {color}
                  <button
                    onClick={() => clearArrayFilter('color', color)}
                    className="text-purple-600 hover:text-purple-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}

              {filters.size?.map((size: string) => (
                <span key={size} className="bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                  Talla: {size}
                  <button
                    onClick={() => clearArrayFilter('size', size)}
                    className="text-orange-600 hover:text-orange-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Filtro de precio */}
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                  Precio: ${filters.minPrice || 0} - ${filters.maxPrice !== undefined ? `$${filters.maxPrice}` : '∞'}
                  <button
                    onClick={() => {
                      setFilters(prev => {
                        const newFilters = { ...prev };
                        delete newFilters.minPrice;
                        delete newFilters.maxPrice;
                        return newFilters;
                      });
                    }}
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}

              {/* Filtro de rating */}
              {filters.rating && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                  Rating: {filters.rating}+ estrellas
                  <button
                    onClick={() => clearFilter('rating')}
                    className="text-yellow-600 hover:text-yellow-800 font-bold"
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
          {products.map((product) => {
            const getPrice = (product: Product) => {
              const variant = product.variants?.[0];
              if (!variant || !variant.prices?.length) return "—";

              // Priorizar MXN
              const mxnPrice = variant.prices.find((p: any) => p.currency_code === 'mxn');
              if (mxnPrice) return `$${(mxnPrice.amount / 100).toFixed(2)} MXN`;

              // Fallback a USD
              const usdPrice = variant.prices.find((p: any) => p.currency_code === 'usd');
              if (usdPrice) return `$${(usdPrice.amount / 100).toFixed(2)} USD`;

              // Último recurso
              return `$${(variant.prices[0].amount / 100).toFixed(2)}`;
            };

            const productPrice = getPrice(product);

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description}
                imageUrl={product.thumbnail || product.images?.[0]?.url || undefined}
                price={productPrice}
                showRating={true}
                useFirebaseStats={true}
                footerText="Entrega rápida 🚚"
                label="Nuevo"
                variants={product.variants.length}
              />
            );
          })}
        </div>
      )}

      {/* Botón Cargar Más */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Cargando más...' : 'Cargar más productos'}
          </button>
        </div>
      )}
    </div>
  );
}