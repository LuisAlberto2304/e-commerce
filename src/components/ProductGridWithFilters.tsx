/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "@/app/lib/medusaClient";
import { ProductCard } from "./ProductCard";
import { Product } from "@/app/types/newProduct";
import { Filters } from "@/app/types/filters";
import { useProductRatings } from "@/hooks/useProductRatings"; // 🔹 Nuevo hook

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ratings, loading: ratingsLoading } = useProductRatings();

  useEffect(() => {
    let mounted = true;
    
    const loadAllProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts({
          limit: 200,
        });

        if (!mounted) return;
        
        console.log("✅ Productos cargados:", data.products?.length || 0);
        setAllProducts(data.products || []);
        setProducts(data.products || []);
        
        // 🔹 Pasar los productos al componente padre
        if (onProductsLoad) {
          onProductsLoad(data.products || []);
        }
        
      } catch (err: any) {
        console.error("❌ Error cargando productos:", err);
        if (mounted) {
          setError(err?.message || "Error al obtener productos");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAllProducts();
    
    return () => {
      mounted = false;
    };
  }, [onProductsLoad]);

   const normalizeColors = (colors: string[]): string[] => {
    const colorMap: { [key: string]: string } = {
      'black': 'Negro',
      'white': 'Blanco', 
      'red': 'Rojo',
      'blue': 'Azul',
      'green': 'Verde',
      'yellow': 'Amarillo',
      'gray': 'Gris',
      'grey': 'Gris',
      'pink': 'Rosa',
      'purple': 'Morado',
      'orange': 'Naranja',
      'brown': 'Marrón',
      'beige': 'Beige'
    };

    const normalized = new Set<string>();
    
    colors.forEach(color => {
      const lowerColor = color.toLowerCase();
      const translated = colorMap[lowerColor] || color;
      
      // Mantener la capitalización correcta (primera letra mayúscula)
      const finalColor = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
      normalized.add(finalColor);
    });
    
    return Array.from(normalized).sort();
  };

  // Función mejorada para normalizar tallas
  const normalizeSizes = (sizes: string[]): string[] => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Talla Única'];
    const numericSizes: string[] = [];
    const standardSizes: string[] = [];
    
    sizes.forEach(size => {
      // Si es una talla numérica
      if (/^\d+$/.test(size)) {
        numericSizes.push(size);
      } else {
        standardSizes.push(size);
      }
    });
    
    // Ordenar numéricas
    numericSizes.sort((a, b) => parseInt(a) - parseInt(b));
    
    // Ordenar estándar según el orden definido
    standardSizes.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
    
    return [...standardSizes, ...numericSizes];
  };

  // Función principal mejorada con normalización
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
    
    // Aplicar normalización
    if (optionName === 'color') {
      return normalizeColors(rawResults);
    }
    
    if (optionName === 'size') {
      return normalizeSizes(rawResults);
    }
    
    return rawResults.sort();
  };

  // NUEVA función para extraer colores de títulos de variantes como "XL / White"
  const extractColorsFromVariantTitle = (text: string): string[] => {
    if (!text) return [];
    
    const colors: string[] = [];
    
    // Patrón para "Talla / Color" o "Talla - Color"
    const pattern = /\b(XS|S|M|L|XL|XXL|XXXL)\s*[\/\-]\s*([A-Za-z\s]+)/gi;
    const matches = text.matchAll(pattern);
    
    for (const match of matches) {
      if (match[2]) {
        const color = match[2].trim();
        // Normalizar el color (primera letra mayúscula)
        const normalizedColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
        if (!colors.includes(normalizedColor)) {
          colors.push(normalizedColor);
        }
      }
    }
    
    // También buscar colores sueltos
    const standaloneColors = extractColorsFromText(text);
    standaloneColors.forEach(color => {
      if (!colors.includes(color)) {
        colors.push(color);
      }
    });
    
    return colors;
  };

  const extractSizesFromText = (text: string): string[] => {
  if (!text) return [];
  
  const sizes: string[] = [];
  const sizePatterns = [
    /\b(XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL)\b/gi,
    /\b(ONESIZE|ONE SIZE|UNICA TALLA|TALLA ÚNICA|UNICA)\b/gi,
    /\b(\d+(?:\.\d+)?[Mm]?[Ll]?)\b/g,
  ];

  sizePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const size = match.toUpperCase().trim();
        let normalizedSize = size;
        if (size === 'ONESIZE' || size === 'ONE SIZE' || size === 'UNICA TALLA' || size === 'TALLA ÚNICA' || size === 'UNICA') {
          normalizedSize = 'Talla Única';
        }
        if (!sizes.includes(normalizedSize)) {
          sizes.push(normalizedSize);
        }
      });
    }
  });

  return sizes;
};

  // Función extractColorsFromText mejorada
  const extractColorsFromText = (text: string): string[] => {
    if (!text) return [];
    
    const colors: string[] = [];
    const colorPatterns = [
      /\b(ROJO|AZUL|VERDE|AMARILLO|NEGRO|BLANCO|GRIS|ROSA|MORADO|NARANJA|MARRÓN|BEIGE|CAFE|MARRON)\b/gi,
      /\b(RED|BLUE|GREEN|YELLOW|BLACK|WHITE|GRAY|PINK|PURPLE|ORANGE|BROWN|BEIGE)\b/gi,
    ];

    colorPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Normalizar: Primera letra mayúscula, resto minúsculas
          const normalizedColor = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
          // Traducir si es necesario
          const translatedColor = translateColor(normalizedColor);
          if (!colors.includes(translatedColor)) {
            colors.push(translatedColor);
          }
        });
      }
    });

    return colors;
  };

  // Función para traducir colores del inglés al español
  const translateColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'Red': 'Rojo',
      'Blue': 'Azul', 
      'Green': 'Verde',
      'Yellow': 'Amarillo',
      'Black': 'Negro',
      'White': 'Blanco',
      'Gray': 'Gris',
      'Grey': 'Gris',
      'Pink': 'Rosa',
      'Purple': 'Morado',
      'Orange': 'Naranja',
      'Brown': 'Marrón',
      'Beige': 'Beige'
    };
    
    return colorMap[color] || color;
  };

   const availableColors = useMemo(() => 
    getUniqueVariantOptions('color'), 
    [allProducts]
  );

  const availableSizes = useMemo(() => 
    getUniqueVariantOptions('size'), 
    [allProducts]
  );

  // Cargar todos los productos una vez
  // Después de cargar los productos, enriquece los datos
  useEffect(() => {
    let mounted = true;
    
    const loadAllProducts = async () => {
      setLoading(true);
      try {
        console.log("🔄 Iniciando carga de productos...");
        
        const data = await fetchProducts({
          limit: 200,
        });

        if (!mounted) return;
        
        let products = data.products || [];
        
        // 🔹 ENRIQUECER DATOS: Agregar información de colores basada en variantes
        products = products.map((product: any) => {
          // Extraer tallas únicas de las variantes
          const sizes = new Set<string>();
          const colors = new Set<string>();
          
          if (product.variants) {
            product.variants.forEach((variant: any) => {
              // Extraer tallas del título de la variante
              if (variant.title) {
                const extractedSizes = extractSizesFromText(variant.title);
                extractedSizes.forEach(size => sizes.add(size));
              }
              
              // Extraer colores del SKU y título
              if (variant.sku) {
                const extractedColors = extractColorsFromText(variant.sku);
                extractedColors.forEach(color => colors.add(color));
              }
            });
          }
          
          return {
            ...product,
            // Agregar metadata calculada
            _computed_metadata: {
              sizes: Array.from(sizes),
              colors: Array.from(colors),
              available_options: {
                sizes: Array.from(sizes),
                colors: Array.from(colors)
              }
            }
          };
        });
        
        console.log("✅ Productos cargados y enriquecidos:", products.length);
        setAllProducts(products);
        setProducts(products);
        
        // Calcular opciones disponibles
        setTimeout(() => {
          const colors = getUniqueVariantOptions('color');
          const sizes = getUniqueVariantOptions('size');
          console.log("📊 RESUMEN FINAL:", {
            totalProducts: products.length,
            colorsFound: colors.length,
            sizesFound: sizes.length,
            colors: colors,
            sizes: sizes
          });
        }, 1000);
        
      } catch (err: any) {
        console.error("❌ Error cargando productos:", err);
        if (mounted) {
          setError(err?.message || "Error al obtener productos");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAllProducts();
    
    return () => {
      mounted = false;
    };
  }, []);

 



const getAllUniqueColors = useMemo(() => {
  const colors = new Set<string>();
  
  allProducts.forEach(product => {
    if (product.variants) {
      product.variants.forEach((variant: any) => {
        const variantTitle = variant.title || '';
        const variantSku = variant.sku || '';
        
        const colorsFromTitle = extractColorsFromVariantTitle(variantTitle);
        const colorsFromSku = extractColorsFromText(variantSku);
        
        [...colorsFromTitle, ...colorsFromSku].forEach(color => {
          if (color) colors.add(color);
        });
      });
    }
  });
  
  return normalizeColors(Array.from(colors));
}, [allProducts]);

  // Función para obtener todas las tallas únicas
  const getAllUniqueSizes = useMemo(() => {
    const sizes = new Set<string>();
    
    allProducts.forEach(product => {
      if (product.variants) {
        product.variants.forEach((variant: any) => {
          const variantTitle = variant.title || '';
          const extractedSizes = extractSizesFromText(variantTitle);
          extractedSizes.forEach(size => {
            if (size) sizes.add(size);
          });
        });
      }
    });
    
    return normalizeSizes(Array.from(sizes));
  }, [allProducts]);

  const getProductPriceNumber = (product: Product): number | null => {
    const variant = product.variants?.[0];
    if (!variant) return null;
    
    if (variant.prices?.length > 0) {
      return variant.prices[0].amount / 100;
    }
    
    return null;
  };

  const getProductRating = (productId: string): number => {
    return ratings[productId] || 0;
  };

  // Cargar productos
  useEffect(() => {
    let mounted = true;
    
    const loadAllProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts({ limit: 200 });
        
        if (!mounted) return;
        
        console.log("✅ Productos cargados:", data.products?.length || 0);
        setAllProducts(data.products || []);
        setProducts(data.products || []);
        
        if (onProductsLoad) {
          onProductsLoad(data.products || []);
        }
        
      } catch (err: any) {
        console.error("❌ Error cargando productos:", err);
        if (mounted) {
          setError(err?.message || "Error al obtener productos");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAllProducts();
    
    return () => {
      mounted = false;
    };
  }, [onProductsLoad]);

  // Filtrar productos - VERSIÓN MEJORADA con colores reales
  const filteredProducts = useMemo(() => {
    if (!allProducts.length) return [];

    let filtered = [...allProducts];
    console.log("🔄 Iniciando filtrado REAL por variantes...", { filters });

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
      
      // Mostrar productos que pasaron el filtro
      if (filtered.length > 0 && filtered.length <= 5) {
        console.log("🎯 Productos que pasaron el filtro:");
        filtered.forEach(product => {
          const rating = ratings[product.id]?.averageRating || 0;
          console.log(`   ✅ ${product.title}: ${rating} estrellas`);
        });
      }
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

  useEffect(() => {
    if (!ratingsLoading && allProducts.length > 0) {
      console.log("🔍 DEBUG RATINGS:");
      console.log("Total productos:", allProducts.length);
      console.log("Ratings cargados:", Object.keys(ratings).length);
      
      // Mostrar ratings de los primeros 5 productos
      allProducts.slice(0, 5).forEach(product => {
        const rating = getProductRating(product.id);
        console.log(`   - ${product.title}: ${rating} estrellas`);
      });
      
      // Contar productos con rating >= 4
      const highRated = allProducts.filter(p => getProductRating(p.id) >= 4).length;
      console.log(`Productos con 4+ estrellas: ${highRated}`);
    }
  }, [ratingsLoading, allProducts, ratings]);

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
              {filters.categories?.map((catId) => (
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
              
              {filters.color?.map(color => (
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
              
              {filters.size?.map(size => (
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
              if (!variant) return "—";
              
              if (variant.prices?.length > 0) {
                return `$${(variant.prices[0].amount / 100).toFixed(2)}`;
              }
              
              return "—";
            };

            const productPrice = getPrice(product);

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description}
                imageUrl={product.thumbnail || undefined}
                price={productPrice}
                showRating={true} // 🔹 Mostrar rating
                useFirebaseStats={true} // 🔹 Obtener datos desde Firebase
                footerText="Entrega rápida 🚚"
                label="Nuevo"
                variants={product.variants.length}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}