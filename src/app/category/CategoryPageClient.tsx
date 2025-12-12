/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FiltersSidebar from "@/components/FiltersSidebar";
import ProductGridWithFilters from "@/components/ProductGridWithFilters";
import { useDebounce } from "@/hooks/useDebounce";
import { Filters } from "@/app/types/filters";

import {
  extractColorsFromVariantTitle,
  extractColorsFromText,
  normalizeColors,
  normalizeSizes,
  extractSizesFromText
} from "@/utils/productUtils";

export default function CategoryPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Estado para productos

  // Inicializar filtros desde URL
  const [filters, setFilters] = useState<Filters>(() => {
    const params = new URLSearchParams(searchParams.toString());
    const initialFilters: Filters = {};

    if (params.get("q")) initialFilters.q = params.get("q") || undefined;
    if (params.get("category")) initialFilters.categories = params.get("category")?.split(",") || undefined;
    if (params.get("size")) initialFilters.size = params.get("size")?.split(",") || undefined;
    if (params.get("color")) initialFilters.color = params.get("color")?.split(",") || undefined;
    if (params.get("minPrice")) initialFilters.minPrice = Number(params.get("minPrice"));
    if (params.get("maxPrice")) initialFilters.maxPrice = Number(params.get("maxPrice"));

    return initialFilters;
  });

  const [searchTerm, setSearchTerm] = useState(filters.q || '');

  // Aplicar debounce a la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 800);

  // Sincronizar URL cuando cambian los filtros
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.q) params.set("q", filters.q);
    if (filters.categories?.length) params.set("category", filters.categories.join(","));
    if (filters.size?.length) params.set("size", filters.size.join(","));
    if (filters.color?.length) params.set("color", filters.color.join(","));
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      router.replace(`?${newQuery}`, { scroll: false });
    }
  }, [filters, router, searchParams]);

  // Actualizar filters.q cuando el debounced search term cambie
  useEffect(() => {
    setFilters(prev => {
      const newQuery = debouncedSearchTerm.trim() || undefined;
      if (prev.q === newQuery) return prev;
      return { ...prev, q: newQuery };
    });
  }, [debouncedSearchTerm]);

  // Función para manejar cambios en la búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };


  // Calcular productos filtrados
  const filteredProducts = useMemo(() => {
    if (!allProducts.length) return [];

    let filtered = [...allProducts];

    // El filtro por búsqueda ahora usa debouncedSearchTerm indirectamente a través de filters.q
    if (filters.q) {
      const query = filters.q.toLowerCase();
      // console.log(`🔍 Aplicando filtro de búsqueda: "${query}"`);

      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.variants?.some((variant: any) =>
          variant.sku?.toLowerCase().includes(query)
        )
      );
    }

    // ... resto de tus filtros (categorías, color, tamaño)
    if (filters.categories?.length) {
      filtered = filtered.filter(product =>
        product.categories?.some((cat: any) =>
          filters.categories?.includes(cat.id)
        )
      );
    }

    if (filters.size?.length) {
      filtered = filtered.filter(product => {
        return product.variants?.some((variant: any) => {
          const variantTitle = variant.title?.toLowerCase() || '';
          return filters.size?.some(size =>
            variantTitle.includes(size.toLowerCase())
          );
        });
      });
    }

    if (filters.color?.length) {
      filtered = filtered.filter(product => {
        return product.variants?.some((variant: any) => {
          const variantTitle = variant.title || '';
          const variantSku = variant.sku || '';

          const colorsInTitle = extractColorsFromVariantTitle(variantTitle);
          const colorsInSku = extractColorsFromText(variantSku);
          const allColors = [...colorsInTitle, ...colorsInSku];

          return filters.color?.some(filterColor =>
            allColors.some(productColor =>
              productColor.toLowerCase() === filterColor.toLowerCase()
            )
          );
        });
      });
    }

    return filtered;
  }, [allProducts, filters]);

  // Función para extraer opciones únicas (similar a la que tienes en ProductGridWithFilters)
  const getUniqueVariantOptions = (optionName: string): string[] => {
    const options = new Set<string>();

    allProducts.forEach((product) => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          const variantTitle = variant.title || '';
          const variantSku = variant.sku || '';

          if (optionName === 'size') {
            const sizes = extractSizesFromText(variantTitle);
            sizes.forEach(size => {
              if (size) options.add(size);
            });
          }

          if (optionName === 'color') {
            const colors = extractColorsFromVariantTitle(variantTitle);
            colors.forEach(color => {
              if (color) options.add(color);
            });

            const colorsFromSku = extractColorsFromText(variantSku);
            colorsFromSku.forEach(color => {
              if (color) options.add(color);
            });
          }
        });
      }
    });

    const rawResults = Array.from(options);

    if (optionName === 'color') {
      return normalizeColors(rawResults);
    }

    if (optionName === 'size') {
      return normalizeSizes(rawResults);
    }

    return rawResults.sort();
  };


  // Calcular opciones disponibles
  const availableColors = useMemo(() =>
    getUniqueVariantOptions('color'),
    [allProducts]
  );

  const availableSizes = useMemo(() =>
    getUniqueVariantOptions('size'),
    [allProducts]
  );

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();

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
      <FiltersSidebar
        categories={categories}
        filters={filters}
        searchTerm={searchTerm} // Pasar searchTerm separado
        onSearchChange={handleSearchChange}
        setFilters={setFilters}
        availableColors={availableColors}
        availableSizes={availableSizes}
      />
      <main className="flex-1 p-6">
        <ProductGridWithFilters
          filters={filters}
          setFilters={setFilters}
          onProductsLoad={setAllProducts} // Nueva prop para pasar los productos
        />
      </main>
    </div>
  );
}