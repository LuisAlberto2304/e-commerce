/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from "react";
import FiltersSidebar from "@/components/FiltersSidebar";
import ProductGridWithFilters from "@/components/ProductGridWithFilters";
import { useDebounce } from "@/hooks/useDebounce";
import { Filters } from "@/app/types/filters";

export default function CategoryPageClient() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Estado para productos
  const [searchTerm, setSearchTerm] = useState('');
  
  // Aplicar debounce a la búsqueda (300ms de delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 800);

    // Actualizar filters.q cuando el debounced search term cambie
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      q: debouncedSearchTerm.trim() || undefined
    }));
  }, [debouncedSearchTerm]);

  // Función para manejar cambios en la búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

    const extractColorsFromVariantTitle = (text: string): string[] => {
    if (!text) return [];
    const colors: string[] = [];
    const pattern = /\b(XS|S|M|L|XL|XXL|XXXL)\s*[\/\-]\s*([A-Za-z\s]+)/gi;
    const matches = text.matchAll(pattern);
    
    for (const match of matches) {
      if (match[2]) {
        const color = match[2].trim();
        const normalizedColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
        if (!colors.includes(normalizedColor)) {
          colors.push(normalizedColor);
        }
      }
    }

    
    
    const standaloneColors = extractColorsFromText(text);
    standaloneColors.forEach(color => {
      if (!colors.includes(color)) {
        colors.push(color);
      }
    });
    
    return colors;
  };

    const translateColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'Red': 'Rojo', 'Blue': 'Azul', 'Green': 'Verde', 'Yellow': 'Amarillo',
      'Black': 'Negro', 'White': 'Blanco', 'Gray': 'Gris', 'Grey': 'Gris',
      'Pink': 'Rosa', 'Purple': 'Morado', 'Orange': 'Naranja', 'Brown': 'Marrón', 'Beige': 'Beige'
    };
    return colorMap[color] || color;
  };

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
          const normalizedColor = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
          const translatedColor = translateColor(normalizedColor);
          if (!colors.includes(translatedColor)) {
            colors.push(translatedColor);
          }
        });
      }
    });
    return colors;
  };


  // Calcular productos filtrados
  const filteredProducts = useMemo(() => {
    if (!allProducts.length) return [];

    let filtered = [...allProducts];

    // El filtro por búsqueda ahora usa debouncedSearchTerm indirectamente a través de filters.q
    if (filters.q) {
      const query = filters.q.toLowerCase();
      console.log(`🔍 Aplicando filtro de búsqueda: "${query}"`);
      
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

  // Funciones auxiliares (las mismas que en ProductGridWithFilters)
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

  const normalizeColors = (colors: string[]): string[] => {
    const colorMap: { [key: string]: string } = {
      'black': 'Negro', 'white': 'Blanco', 'red': 'Rojo', 'blue': 'Azul',
      'green': 'Verde', 'yellow': 'Amarillo', 'gray': 'Gris', 'grey': 'Gris',
      'pink': 'Rosa', 'purple': 'Morado', 'orange': 'Naranja', 'brown': 'Marrón', 'beige': 'Beige'
    };
    const normalized = new Set<string>();
    colors.forEach(color => {
      const lowerColor = color.toLowerCase();
      const translated = colorMap[lowerColor] || color;
      const finalColor = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
      normalized.add(finalColor);
    });
    return Array.from(normalized).sort();
  };

  const normalizeSizes = (sizes: string[]): string[] => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Talla Única'];
    const numericSizes: string[] = [];
    const standardSizes: string[] = [];
    
    sizes.forEach(size => {
      if (/^\d+$/.test(size)) {
        numericSizes.push(size);
      } else {
        standardSizes.push(size);
      }
    });
    
    numericSizes.sort((a, b) => parseInt(a) - parseInt(b));
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