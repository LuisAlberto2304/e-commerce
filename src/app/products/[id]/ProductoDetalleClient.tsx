/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { ShoppingCart, Heart, Check, AlertCircle } from "lucide-react";
import { fetchProductById, fetchCategoryById, fetchProducts } from "@/app/lib/medusaClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import StockStatus from "@/components/StockStatus";
import ProductCarousel from "@/components/ProductCarousel";
import ProductReviews from "@/components/ProductReviews";
import { mockReviews } from "@/app/data/mockData";
import Image from "next/image";
import { CardProps } from "@/components/ProductCardCarousel";
import { CartItem, useCart } from "@/context/CartContext";
import axios from "axios";

type Props = { 
  id: string;
  initialProduct?: any;
  initialCategory?: any;
  recommendedProducts?: any[];
};

// Tipos locales
interface ProductOption {
  id: string;
  title: string;
  values: ProductOptionValue[];
}

interface ProductOptionValue {
  id: string;
  value: string;
  variant_id?: string;
}

interface ProductVariant {
  id: string;
  title: string; // "S / Black"
  sku?: string;
  inventory_items?: any[]; // contiene total_quantity
  prices?: any[];
  images?: any[];
  // otros campos posibles...
}

// Helpers de imágenes (tu lógica original)
const getProductImages = (product: any) => {
  if (!product) return [];

  const images: { url: any; id: string; }[] = [];

  console.log("🔍 Buscando imágenes en producto:", {
    hasImages: !!product.images,
    imagesCount: product.images?.length,
    hasThumbnail: !!product.thumbnail,
    hasVariants: !!product.variants,
    variantsCount: product.variants?.length
  });

  if (product.images && Array.isArray(product.images)) {
    console.log("✅ Imágenes principales encontradas:", product.images);
    images.push(...product.images);
  }

  if (product.thumbnail && !images.some(img => img.url === product.thumbnail)) {
    console.log("✅ Thumbnail encontrado:", product.thumbnail);
    images.push({ 
      url: product.thumbnail, 
      id: 'thumbnail'
    });
  }

  if (images.length === 0 && product.variants) {
    console.log("🔍 Buscando imágenes en variantes...");
    product.variants.forEach((variant: any) => {
      if (variant.images && Array.isArray(variant.images)) {
        console.log("✅ Imágenes de variante encontradas:", variant.images);
        images.push(...variant.images);
      }
      if (variant.thumbnail && !images.some(img => img.url === variant.thumbnail)) {
        images.push({ 
          url: variant.thumbnail, 
          id: `variant-thumbnail-${variant.id}` 
        });
      }
      // Medusa a veces devuelve thumbnail dentro de inventory items as well - no asumimos demasiado
    });
  }

  console.log("🖼️ Total de imágenes encontradas:", images.length);
  return images;
};

const getAbsoluteImageUrl = (url: string | undefined | null): string | null => {
  if (!url) {
    // console.log("❌ URL de imagen undefined o null");
    return null;
  }

  if (url.startsWith('http')) return url;

  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  if (medusaUrl) {
    const relativeUrl = url.startsWith('/') ? url : `/${url}`;
    return `${medusaUrl}${relativeUrl}`;
  }
  return url;
};

// -------------------------------------------------
// Componente principal (corrigido)
// -------------------------------------------------
export default function ProductoDetalleClient({ id, initialProduct, initialCategory, recommendedProducts = [] }: Props) {
  const [producto, setProducto] = useState<any | null>(initialProduct || null);
  const [category, setCategory] = useState<any | null>(initialCategory || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [recommended, setRecommended] = useState<any[]>(recommendedProducts);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [availableCombinations, setAvailableCombinations] = useState<Set<string>>(new Set());
  const [availableOptions, setAvailableOptions] = useState<{ [key: string]: string[] }>({});
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [optionsInitialized, setOptionsInitialized] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Obtener imágenes del producto (helper)
  const productImages = getProductImages(producto);
  const absoluteSelectedImage = selectedImage ? getAbsoluteImageUrl(selectedImage) : null;

  // -------------------------------------------------
  // Reconstruir opciones desde producto + variant.title
  // -------------------------------------------------
  const extractOptionsFromVariants = (producto: any) => {
    if (!producto || !producto.variants?.length) return [];
    console.log("🔍 Extrayendo opciones desde producto:", producto);

    const combos = new Set<string>();
    const options: Record<string, Set<string>> = {};

    // Extrae títulos base (Talla, Color, etc.)
    const optionTitles = producto?.options?.map((o: any) => o.title) || [];

    producto.variants.forEach((variant: any) => {
      const parts = (variant.title || "").split(" / ").map((p: string) => p.trim());
      combos.add(variant.title);

      parts.forEach((value: string, i: number) => {
        const title = optionTitles[i] || `Opción ${i + 1}`;
        if (!options[title]) options[title] = new Set();
        options[title].add(value);
      });
    });

    return Object.entries(options).map(([title, values]) => ({
      title,
      values: Array.from(values),
    }));
  };

  // Variants list
  const productVariants = useMemo((): ProductVariant[] => {
    return producto?.variants || [];
  }, [producto]);

  // productOptions reconstruidas
  const productOptions = useMemo(() => {
      if (producto?.options?.length > 0) {
        return producto.options.map((o: any) => ({
          title: o.title,
          values: o.values?.map((v: any) => v.value) || [],
        }));
      }
      return extractOptionsFromVariants(producto);
    }, [producto]);

  // -------------------------------------------------
  // Helper: obtener stock real de una variante
  // -------------------------------------------------
  const getVariantStock = (variant: any): number => {
    // Medusa expone inventory_items con total_quantity (según tu log)
    if (!variant) return 0;
    if (typeof variant.total_quantity === "number") return variant.total_quantity;
    if (Array.isArray(variant.inventory_items) && variant.inventory_items.length > 0) {
      // sumar total_quantity de cada inventory item (defensivo)
      return variant.inventory_items.reduce((acc: number, it: any) => {
        const tq = typeof it.total_quantity === "number" ? it.total_quantity : (it.inventory?.available_quantity ?? 0);
        return acc + Number(tq || 0);
      }, 0);
    }
    return 0;
  };

  // -------------------------------------------------
  // Encontrar variante que coincida con selectedOptions
  // -------------------------------------------------
// Versión mejorada de la función
 const findMatchingVariant = (producto: any, selectedOptions: Record<string, string>) => {
    if (!producto || !producto.variants || !selectedOptions) {
      console.log('❌ Datos faltantes para buscar variante');
      return null;
    }

    console.log('🔍 Buscando variante con opciones:', selectedOptions);

    const matchingVariant = producto.variants.find((variant: any) => {
      const parts = (variant.title || "").split(" / ").map((p: string) => p.trim());
      const optionTitles = productOptions.map((opt: any) => opt.title) || [];

      console.log('📋 Variante:', variant.title, 'Partes:', parts);

      const variantOptions: Record<string, string> = {};
      optionTitles.forEach((title: string, index: number) => {
        variantOptions[title] = parts[index];
      });

      console.log('🔍 Comparando - Variante:', variantOptions, 'Seleccionado:', selectedOptions);

      const matches = Object.entries(selectedOptions).every(
        ([key, value]) => variantOptions[key] === value
      );

      console.log('✅ Coincide:', matches, 'para variante:', variant.title);
      return matches;
    });

    console.log('🎯 Variante encontrada:', matchingVariant);
    return matchingVariant;
  };

  // -------------------------------------------------
  // Calcular todas las combinaciones disponibles (para bloquear opciones no disponibles)
  // -------------------------------------------------
  useEffect(() => {
    if (producto && productOptions.length > 0 && !optionsInitialized) {
      console.log('🔄 Inicializando opciones desde productOptions:', productOptions);
      
      const defaults: Record<string, string> = {};
      
      productOptions.forEach((option: any) => {
        if (option.values && option.values.length > 0) {
          const firstValue = typeof option.values[0] === 'string' 
            ? option.values[0] 
            : option.values[0].value;
          defaults[option.title] = firstValue;
        }
      });

      if (Object.keys(defaults).length > 0) {
        console.log('🎯 Estableciendo opciones por defecto:', defaults);
        setSelectedOptions(defaults);
        setOptionsInitialized(true);
      }
    }
  }, [producto, productOptions, optionsInitialized]);

  useEffect(() => {
  if (optionsInitialized && Object.keys(selectedOptions).length > 0) {
    console.log('🔄 Buscando variante para opciones:', selectedOptions);
    
    const matchingVariant = findMatchingVariant(producto, selectedOptions);
    setSelectedVariant(matchingVariant);
    
    if (matchingVariant) {
      const stock = getVariantStock(matchingVariant);
      setAvailableQuantity(stock);
    } else {
      setAvailableQuantity(0);
    }
  }
}, [selectedOptions, optionsInitialized, producto]);

  // Comprueba si una opción es válida con la combinación actual
  const isOptionAvailable = (optionTitle: string, optionValue: string): boolean => {
    if (availableCombinations.size === 0) return true;

    const current = { ...selectedOptions, [optionTitle]: optionValue };
    const key = Object.entries(current).map(([k,v]) => `${k}:${v}`).sort().join("|");
    return availableCombinations.has(key);
  };

  // -------------------------------------------------
  // Inicializar opciones por defecto (cuando productOptions esté listo)
  // -------------------------------------------------
// Función de inicialización robusta
  const initializeDefaultOptions = () => {
    if (!producto || !producto.variants?.length) return;

    console.log('🎯 Inicializando opciones con productOptions:', productOptions);

    const defaults: Record<string, string> = {};

    // Para cada opción, tomar el primer valor disponible
    productOptions.forEach((option: any) => {
      if (option.values && option.values.length > 0) {
        // Tomar el primer valor de la opción
        const firstValue = option.values[0].value || option.values[0];
        defaults[option.title] = firstValue;
        console.log(`✅ ${option.title}: ${firstValue}`);
      }
    });

    if (Object.keys(defaults).length > 0) {
      console.log('🎯 Opciones inicializadas:', defaults);
      setSelectedOptions(defaults);
      
      const matchingVariant = findMatchingVariant(producto, defaults);
      setSelectedVariant(matchingVariant);
      
      if (matchingVariant) {
        const stock = getVariantStock(matchingVariant);
        setAvailableQuantity(stock);
      }
    }
  };

  useEffect(() => {
  if (producto && productOptions.length > 0 && Object.keys(selectedOptions).length === 0) {
    console.log('🔄 Inicializando opciones desde productOptions:', productOptions);
    
    const defaults: Record<string, string> = {};
    
    // Para cada opción, tomar el primer valor disponible
    productOptions.forEach((option: any) => {
      if (option.values && option.values.length > 0) {
        // Los valores pueden venir como strings directamente o como objetos
        const firstValue = typeof option.values[0] === 'string' 
          ? option.values[0] 
          : option.values[0].value;
        defaults[option.title] = firstValue;
        console.log(`✅ ${option.title}: ${firstValue}`);
      }
    });

    console.log('🎯 Opciones por defecto:', defaults);

    if (Object.keys(defaults).length > 0) {
      setSelectedOptions(defaults);
      
      // Buscar la variante que coincida
      const matchingVariant = findMatchingVariant(producto, defaults);
      setSelectedVariant(matchingVariant);
      
      if (matchingVariant) {
        const stock = getVariantStock(matchingVariant);
        setAvailableQuantity(stock);
        console.log('✅ Variante inicial encontrada:', matchingVariant.title);
      }
    }
  }
}, [producto, productOptions, selectedOptions]);

  // -------------------------------------------------
  // Calcular opciones disponibles (lista por cada option)
  // -------------------------------------------------
  const calculateAvailableOptions = (currentOptions: { [key: string]: string }) => {
    const available: { [key: string]: string[] } = {};
    
    // Inicializar array vacío para cada opción
    productOptions.forEach((opt: any) => {
      available[opt.title] = [];
    });

    if (!producto || !producto.variants) return available;

    const optionTitles = producto?.options?.map((o: any) => o.title) || [];

    // Para cada opción, verificar qué valores son disponibles
    productOptions.forEach((option: any) => {
      option.values.forEach((valueObj: any) => {
        const value = valueObj.value || valueObj;
        
        // Crear combinación temporal
        const tempOptions = { ...currentOptions, [option.title]: value };
        
        // Verificar si existe variante con esta combinación y stock
        const variantExists = producto.variants.some((variant: any) => {
          const parts = (variant.title || "").split(" / ").map((p: string) => p.trim());
          
          // Mapear partes de variant a opciones
          const variantOptions: Record<string, string> = {};
          optionTitles.forEach((title: string, index: number) => {
            if (parts[index]) {
              variantOptions[title] = parts[index];
            }
          });

          // Verificar coincidencia
          const matches = Object.entries(tempOptions).every(([key, val]) => {
            return variantOptions[key] === val;
          });

          return matches && getVariantStock(variant) > 0;
        });

        if (variantExists) {
          available[option.title].push(value);
        }
      });
    });

    return available;
  };

  // -------------------------------------------------
  // Handler cambio de opción por UI
  // -------------------------------------------------
  const handleOptionChange = (optionTitle: string, value: string) => {
    console.log('🔄 Cambiando opción:', { optionTitle, value });

    const newOptions = { ...selectedOptions, [optionTitle]: value };
    setSelectedOptions(newOptions);

    // buscar variante que coincida
    const matchingVariant = findMatchingVariant(producto, newOptions);
    setSelectedVariant(matchingVariant);

    // actualizar imagen si la variante tiene imagen
    if (matchingVariant) {
      const variantImg = matchingVariant.thumbnail || matchingVariant.images?.[0]?.url || producto.thumbnail;
      if (variantImg) setSelectedImage(getAbsoluteImageUrl(variantImg));
    }

    // recalcular opciones disponibles
    const newAvailable = calculateAvailableOptions(newOptions);
    setAvailableOptions(newAvailable);
  };

  // -------------------------------------------------
  // Precio actual
  // -------------------------------------------------


  const getOriginalPrice = () => {
    const variant = selectedVariant || producto?.variants?.[0];
    const originalPrice = variant?.original_price || variant?.prices?.find((p: any) => p.is_original)?.amount;
    if (originalPrice && originalPrice > (variant?.prices?.[0]?.amount || 0)) {
      return `$${(originalPrice / 100).toFixed(2)}`;
    }
    return null;
  };

  // -------------------------------------------------
  // Manejo imágenes (igual)
  // -------------------------------------------------
  const handleImageChange = (imageUrl: string) => {
    const absolute = getAbsoluteImageUrl(imageUrl);
    setSelectedImage(absolute);
  };

  const handlePrevImage = () => {
    if (productImages.length > 1 && selectedImage) {
      const currentIndex = productImages.findIndex((img: any) => getAbsoluteImageUrl(img.url) === selectedImage);
      const prevIndex = currentIndex === 0 ? productImages.length - 1 : currentIndex - 1;
      handleImageChange(productImages[prevIndex].url);
    }
  };

  const handleNextImage = () => {
    if (productImages.length > 1 && selectedImage) {
      const currentIndex = productImages.findIndex((img: any) => getAbsoluteImageUrl(img.url) === selectedImage);
      const nextIndex = currentIndex === productImages.length - 1 ? 0 : currentIndex + 1;
      handleImageChange(productImages[nextIndex].url);
    }
  };

  const handleOptionSelect = (optionTitle: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionTitle]: value,
    }));
  };

  // Cart context
  const { addToCart } = useCart();

  const getCurrentPrice = (): number => {
    const priceAmt = selectedVariant?.prices?.[0]?.amount ?? producto?.variants?.[0]?.prices?.[0]?.amount ?? 0;
    return priceAmt / 100;
  };

  // Función para obtener precio formateado
  const getCurrentPriceFormatted = (): string => {
    return `$${getCurrentPrice().toFixed(2)}`;
  };

  // Versión mejorada con manejo de errores robusto
  const checkInventory = async (variantId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/inventory/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.warn('⚠️ API de inventario falló, permitiendo compra:', data.error);
        return true; // Fallback seguro
      }

      if (!data.variantFound) {
        console.warn('⚠️ Variante no encontrada en inventario, pero permitiendo compra');
        return true; // Fallback seguro
      }

      return data.isAvailable;

    } catch (error) {
      console.error('❌ Error crítico en inventory check:', error);
      return true; // Siempre permitir en caso de error crítico
    }
  };


  const handleAddToCart = async  () => {
  if (!selectedVariant) {
    alert("Selecciona una variante antes de continuar");
    return;
  }

  const isAvailable = await checkInventory(selectedVariant.id, quantity);

  if (!isAvailable) {
    alert("Lo sentimos, no hay suficiente stock disponible");
    return;
  }

  setAddingToCart(true);

  try {
    // Crear el objeto CartItem
    const cartItem: CartItem = {
      id: producto.id,
      variantId: selectedVariant.id,
      title: producto.title,
      price: getCurrentPrice(), // Usar la función que retorna número
      image: selectedImage || getAbsoluteImageUrl(productImages[0]?.url) || '/images/placeholder-image.png',
      variantDescription: Object.entries(selectedOptions)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' • '),
      quantity: quantity,
      selectedOptions: selectedOptions
    };

    // Agregar al carrito usando el context
    addToCart(cartItem);

    console.log("🛒 Producto agregado al carrito:", {
      product: producto.title,
      variant: selectedVariant.title,
      quantity: quantity,
      price: getCurrentPriceFormatted()
    });

    // Feedback al usuario
    alert(`✅ ¡Agregado al carrito!\n${producto.title}\n${Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' • ')}\nCantidad: ${quantity}`);

    // Resetear cantidad
    setQuantity(1);

  } catch (error) {
    console.error("❌ Error al agregar al carrito:", error);
    alert("Error al agregar el producto al carrito");
  } finally {
    setAddingToCart(false);
  }
};

  // -------------------------------------------------
  // Debug logs (útiles)
  // -------------------------------------------------
  useEffect(() => {
    if (producto) {
      console.log("🔍 ESTRUCTURA COMPLETA DEL PRODUCTO (debug):", producto);
      console.log("🖼️ Imágenes procesadas:", productImages);
      console.log("📦 Variantes disponibles:", productVariants.length);
      console.log("🎯 Opciones del producto (reconstruidas):", productOptions);
      console.log("🔁 Combinaciones disponibles (stock>0):", Array.from(availableCombinations));
      console.log("🟢 selectedOptions:", selectedOptions);
      console.log("🟢 selectedVariant:", selectedVariant ? { id: selectedVariant.id, title: selectedVariant.title, stock: getVariantStock(selectedVariant) } : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto, productImages, productVariants, productOptions, availableCombinations, selectedOptions, selectedVariant]);

  // Cargar producto si viene id (tu lógica original)
  useEffect(() => {
    if (initialProduct) {
      initializeProduct(initialProduct);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        const productData = await fetchProductById(id);
        const product = productData?.product || productData;

        if (!product) throw new Error('Producto no encontrado');

        initializeProduct(product);

        if (product.category_id) {
          const categoryProductsData = await fetchProducts({ categoryId: product.category_id, limit: 8 });
          const mappedProducts: CardProps[] = categoryProductsData.products
            .filter((p: any) => p.id !== product.id)
            .map((p: any) => ({
              id: p.id,
              title: p.title || "Producto sin nombre",
              description: p.description || "",
              imageUrl: getAbsoluteImageUrl(p.images?.[0]?.url) || "/images/placeholder-image.png",
              price: p.variants?.[0]?.prices?.[0]?.amount ? `$${(p.variants[0].prices[0].amount / 100).toFixed(2)}` : "$0.00",
              originalPrice: undefined,
              label: undefined,
              rating: 0,
              reviewCount: 0,
            }));

          setRecommended(mappedProducts);
        }

      } catch (err) {
        console.error('❌ Error al cargar producto:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialProduct]);

  const initializeProduct = (product: any) => {
    console.log('🎯 INICIALIZANDO PRODUCTO:', product.title);
    setProducto(product);

    const images = getProductImages(product);
    if (images.length > 0) {
      const firstImageUrl = getAbsoluteImageUrl(images[0].url);
      setSelectedImage(firstImageUrl);
    } else {
      setSelectedImage(null);
    }

    // NOTA: initializeDefaultOptions se ejecutará automáticamente cuando productOptions esté listo (useEffect arriba)
  };

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/category' },
    ...(category ? [{ label: category.name, href: `/categorias/${category.id}` }] : []),
    { label: producto?.title || 'Cargando...' },
  ];

  const getStockQuantity = () => {
    return selectedVariant ? getVariantStock(selectedVariant) : 0;
  };

  const originalPrice = getOriginalPrice();
  const stockQuantity = getStockQuantity();
  const isOutOfStock = stockQuantity === 0;

  if (loading) return <div className="max-w-6xl mx-auto p-6 text-center">Cargando producto...</div>;
  if (error) return <div className="max-w-6xl mx-auto p-6 text-center text-red-600">{error}</div>;
  if (!producto) return <div className="max-w-6xl mx-auto p-6 text-center">Producto no encontrado</div>;
  // Justo antes del return principal, agrega:
  if (!optionsInitialized && productOptions.length > 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div>Cargando opciones del producto...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-6">
        {/* Galería */}
        <div className="w-full">
          <div className="relative bg-gray-100 rounded-2xl flex items-center justify-center min-h-[400px]">
            {productImages.length > 0 && selectedImage ? (
              <>
                <div className="w-full aspect-square sm:aspect-[4/3] flex items-center justify-center">
                  <Image
                    src={selectedImage}
                    alt={producto.title}
                    width={600}
                    height={600}
                    className="w-full h-full object-contain rounded-lg"
                    onError={() => {
                      console.error("❌ Error cargando imagen:", selectedImage);
                      setSelectedImage("/images/placeholder-image.png");
                    }}
                    onLoad={() => console.log("✅ Imagen cargada correctamente")}
                  />
                </div>

                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md lg:hidden z-10 hover:bg-white transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md lg:hidden z-10 hover:bg-white transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-gray-400 p-8 text-center">
                <div>No hay imagen disponible</div>
                <div className="text-sm mt-2">Debug: {productImages.length} imágenes encontradas</div>
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {productImages.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {productImages.map((img: any, idx: number) => {
                const absoluteUrl = getAbsoluteImageUrl(img.url);
                return (
                  <button
                    key={img.id || idx}
                    onClick={() => handleImageChange(img.url)}
                    className={`flex-shrink-0 border-2 rounded-lg p-1 transition-all duration-200 ${
                      selectedImage === absoluteUrl 
                        ? 'border-emerald-500 ring-2 ring-emerald-200' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={absoluteUrl || '/images/placeholder-image.png'}
                      alt={`${producto.title} - imagen ${idx + 1}`}
                      className="w-20 h-20 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-image.png';
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Info producto */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{producto.title}</h1>
            {selectedVariant && selectedVariant.sku && (
              <p className="text-sm text-gray-500 mt-1">SKU: {selectedVariant.sku}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <StockStatus quantity={stockQuantity} />
            {stockQuantity > 0 && stockQuantity <= 10 && (
              <span className="text-sm text-amber-600 font-medium">
                ¡Solo {stockQuantity} en stock!
              </span>
            )}
          </div>

          {/* Precios */}
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl lg:text-4xl text-emerald-600 font-bold">
              {getCurrentPrice()}
            </span>
            {originalPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">{originalPrice}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                  Oferta
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed">
            {producto.description || 'No hay descripción disponible'}
          </p>

          {productOptions.length === 0 && (
            <div className="text-gray-500 italic">
              No hay variantes configuradas para este producto.
            </div>
          )}

          {productOptions.map((option: any, optionIndex: number) => {
          console.log(`🔍 Renderizando opción ${option.title}:`, {
            selectedValue: selectedOptions[option.title],
            values: option.values
          });
          
          return (
            <div key={`option-${optionIndex}-${option.title}`} className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg capitalize">{option.title}</h3>
                {selectedOptions[option.title] && (
                  <span className="text-sm text-gray-500">
                    Seleccionado: <strong>{selectedOptions[option.title]}</strong>
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {option.values.map((value: any, valueIndex: number) => {
                  const valueStr = typeof value === 'string' ? value : value.value;
                  const isSelected = selectedOptions[option.title] === valueStr;
                  
                  console.log(`   Valor ${valueStr}: seleccionado?`, isSelected);

                  return (
                    <button
                      key={`option-${optionIndex}-value-${valueIndex}-${valueStr}`}
                      onClick={() => handleOptionChange(option.title, valueStr)}
                      className={`
                        relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 min-w-[60px]
                        ${isSelected 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200" 
                          : "border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:shadow-md"
                        }
                      `}
                    >
                      {valueStr}
                      
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

          {/* Info variante seleccionada */}
          {selectedVariant && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3">
                <Check className="text-green-500 flex-shrink-0" size={20} />
                <div>
                  <p className="text-green-800 font-semibold">Variante seleccionada</p>
                  <p className="text-green-600 text-sm mt-1">
                    {Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(" • ")}
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Stock: {getVariantStock(selectedVariant)} unidades
                  </p>
                </div>
              </div>
            </div>
          )}

          {!selectedVariant && selectedOptions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
                <div>
                  <p className="text-yellow-800 font-semibold">Combinación no disponible</p>
                  <p className="text-yellow-600 text-sm mt-1">
                    Las opciones seleccionadas no están disponibles en stock
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cantidad y botones */}
          <div className="border-t pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="font-semibold text-lg">Cantidad:</span>
              <div className="flex items-center border border-gray-300 rounded-lg w-full sm:w-40">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  -
                </button>
                <span className="px-4 py-3 min-w-[60px] text-center text-base font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= stockQuantity}
                >
                  +
                </button>
              </div>
              
              {stockQuantity > 0 && (
                <span className="text-sm text-gray-500">
                  Máximo: {stockQuantity} unidades
                </span>
              )}
            </div>

            {/* Botones acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart || !selectedVariant}
                className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Agregando...
                  </>
                ) : isOutOfStock ? (
                  'Agotado'
                ) : !selectedVariant ? (
                  'Selecciona opciones'
                ) : (
                  <>
                    <ShoppingCart size={22} />
                    Añadir al carrito - {getCurrentPriceFormatted()}
                  </>
                )}
              </button>
              
              <button 
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-gray-300 px-6 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 transition hover:border-gray-400"
                disabled={isOutOfStock}
              >
                <Heart size={22} />
                Guardar
              </button>
            </div>

            {isOutOfStock && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  Producto agotado. Puedes guardarlo en tus favoritos para recibir notificaciones.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recomendados */}
      <div className="mt-16">
        {recommended.length > 0 ? (
          <ProductCarousel products={recommended} title="También te puede interesar" />
        ) : (
          <p className="text-gray-500 text-center">Cargando productos recomendados...</p>
        )}
      </div>

      {/* Reseñas */}
      <div className="mt-16">
        <ProductReviews reviews={mockReviews} averageRating={4.2} totalReviews={mockReviews.length} />
      </div>
    </div>
  );
}
function setAvailableQuantity(stock: any) {
  throw new Error("Function not implemented.");
}

