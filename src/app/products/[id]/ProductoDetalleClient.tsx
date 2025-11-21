/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { ShoppingCart, Heart, Check, AlertCircle, Share2 } from "lucide-react";
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
import { db, auth } from "@/app/lib/firebaseClient";
import { doc, setDoc, deleteDoc, getDoc, updateDoc, increment, collection } from "firebase/firestore";
import { useAuth } from "@/context/userContext";
import { gtagEvent } from "@/app/lib/gtag";
export const revalidate = 120;

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

  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  const { user } = useAuth(); // tu usuario actual autenticado

   useEffect(() => {
    if (producto) {
      gtagEvent('view_item', {
        currency: 'MXN',
        value: producto.price,
        items: [
          {
            item_id: producto.id,
            item_name: producto.name,
            price: producto.price,
            currency: 'MXN',
            item_category: producto.category || 'Sin categoría',
          },
        ],
      })
      console.log('GA4 view_item enviado:', producto.name)
    }
  }, [producto])

  useEffect(() => {
    if (!user) return;

    const checkFavorite = async () => {
      const favRef = doc(db, "wishlist", `${user.uid}_${producto.id}`);
      const docSnap = await getDoc(favRef);
      if (docSnap.exists()) {
        setIsFavorite(true);
      } else {
        setIsFavorite(false);
      }
    };

    checkFavorite();
  }, [user, producto.id]);




  const toggleFavorite = async () => {
    if (!user) {
      alert("Inicia sesión para guardar productos.");
      return;
    }

    setLoadingFav(true);

    const favRef = doc(db, "wishlist", `${user.uid}_${producto.id}`);

      const price =
      producto.price ??
      producto.variants?.[0]?.prices?.[0]?.amount ??
      0;

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          productId: producto.id,
          name: producto.title,
          image: producto.thumbnail,
          price,
          createdAt: new Date(),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error al actualizar wishlist:", error);
    }

    setLoadingFav(false);
  };

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
     if (!variant) return 0;
 
     // Prioridad 1: `available_quantity` directamente en la variante (expansión simple).
     if (typeof variant.available_quantity === "number") {
       return variant.available_quantity;
     }
 
     // Prioridad 2: Sumar `available_quantity` desde los `location_levels` de cada `inventory_item`.
     // Esta es la estructura que muestras en tu log.
     if (Array.isArray(variant.inventory_items) && variant.inventory_items.length > 0) {
       return variant.inventory_items.reduce((totalStock: number, item: any) => {
         // La ruta correcta es item -> inventory -> location_levels
         const inventory = item.inventory;
         if (inventory && Array.isArray(inventory.location_levels) && inventory.location_levels.length > 0) {
           const stockInLevels = inventory.location_levels.reduce((levelStock: number, level: any) => {
             return levelStock + (level.available_quantity || 0);
           }, 0);
           return totalStock + stockInLevels;
         }
         return totalStock;
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


  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert("Selecciona una variante antes de continuar");
      return;
    }

    const isAvailable = await checkInventory(selectedVariant.id, quantity);

    if (!isAvailable) {
      alert("Lo sentimos, no hay suficiente stock disponible");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Debes iniciar sesión para agregar al carrito");
      return;
    }

    setAddingToCart(true);

    try {
      const cartItem = {
        ownerId: user.uid,
        productId: producto.id,
        variantId: selectedVariant.id,
        title: producto.title,
        price: getCurrentPrice(),
        image: selectedImage || getAbsoluteImageUrl(productImages[0]?.url) || '/images/placeholder-image.png',
        variantDescription: Object.entries(selectedOptions)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' • '),
        quantity: quantity,
        selectedOptions: selectedOptions,
        addedAt: new Date(),
        status: "active"
      };

      const cartRef = collection(db, "users", user.uid, "cart");
      const itemRef = doc(cartRef, cartItem.variantId);

      // Verificar si ya existe el mismo producto (para sumar cantidades)
      const existing = await getDoc(itemRef);

      gtagEvent('add_to_cart', {
        currency: 'MXN',
        value: getCurrentPrice() * quantity,
        items: [
          {
            item_id: producto.id,
            item_name: producto.title,
            item_variant: Object.entries(selectedOptions)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', '),
            price: getCurrentPrice(),
            quantity,
          },
        ],
      });

      if (existing.exists()) {
        await updateDoc(itemRef, { quantity: increment(quantity), addedAt: new Date() });
      } else {
        await setDoc(itemRef, cartItem);
      }

      console.log("🛒 Producto agregado al carrito:", cartItem);
      alert(`✅ ¡Agregado al carrito!\n${producto.title}\n${Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' • ')}\nCantidad: ${quantity}`);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Galería - Estilo Amazon */}
        <div className="lg:col-span-7">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Miniaturas verticales */}
            {productImages.length > 1 && (
              <div className="flex lg:flex-col gap-2 order-2 lg:order-1 overflow-x-auto lg:overflow-visible">
                {productImages.map((img: any, idx: number) => {
                  const absoluteUrl = getAbsoluteImageUrl(img.url);
                  return (
                    <button
                      key={img.id || idx}
                      onClick={() => handleImageChange(img.url)}
                      className={`flex-shrink-0 border rounded p-1 transition-colors ${
                        selectedImage === absoluteUrl 
                          ? 'border-orange-500' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={absoluteUrl || '/images/placeholder-image.png'}
                        alt={`${producto.title} - imagen ${idx + 1}`}
                        className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholder-image.png';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Imagen principal */}
            <div className="flex-1 order-1 lg:order-2">
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center p-4">
                {productImages.length > 0 && selectedImage ? (
                  <div className="relative w-full">
                    <div className="w-full aspect-square flex items-center justify-center">
                      <Image
                        src={selectedImage}
                        alt={producto.title}
                        width={500}
                        height={500}
                        className="w-full h-full object-contain"
                        onError={() => {
                          console.error("❌ Error cargando imagen:", selectedImage);
                          setSelectedImage("/images/placeholder-image.png");
                        }}
                      />
                    </div>

                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-gray-300 p-2 rounded shadow-sm lg:hidden hover:bg-gray-50"
                        >
                          ‹
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-300 p-2 rounded shadow-sm lg:hidden hover:bg-gray-50"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 p-8 text-center">
                    <div>No hay imagen disponible</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información del producto - Estilo Amazon */}
        <div className="lg:col-span-5">
          <div className="space-y-4">
            {/* Título y SKU */}
            <div>
              <h1 className="text-xl lg:text-2xl font-normal text-gray-900 leading-tight">
                {producto.title}
              </h1>
              {selectedVariant && selectedVariant.sku && (
                <p className="text-sm text-gray-500 mt-1">SKU: {selectedVariant.sku}</p>
              )}
            </div>

            {/* Precio */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl text-gray-900">
                {getCurrentPrice()}
              </span>
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
              )}
            </div>

            {/* Estado de stock */}
            <div className="space-y-2">
              <StockStatus quantity={stockQuantity} />
              {stockQuantity > 0 && stockQuantity <= 10 && (
                <p className="text-sm text-orange-600">
                  Solo {stockQuantity} en stock - pide pronto.
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="text-sm text-gray-900 leading-relaxed">
              {producto.description || 'No hay descripción disponible'}
            </div>

            {/* Opciones de variantes */}
            {productOptions.length === 0 && (
              <div className="text-sm text-gray-500">
                No hay variantes configuradas para este producto.
              </div>
            )}

            {productOptions.map((option: any, optionIndex: number) => {
              return (
                <div key={`option-${optionIndex}-${option.title}`} className="pt-4 border-t">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 capitalize">{option.title}</h3>
                    {selectedOptions[option.title] && (
                      <p className="text-sm text-gray-500 mt-1">
                        Seleccionado: <span className="text-gray-700">{selectedOptions[option.title]}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: any, valueIndex: number) => {
                      const valueStr = typeof value === 'string' ? value : value.value;
                      const isSelected = selectedOptions[option.title] === valueStr;
                      
                      return (
                        <button
                          key={`option-${optionIndex}-value-${valueIndex}-${valueStr}`}
                          onClick={() => handleOptionChange(option.title, valueStr)}
                          className={`
                            px-3 py-2 text-sm border rounded transition-colors min-w-[60px]
                            ${isSelected 
                              ? "border-orange-500 bg-orange-50" 
                              : "border-gray-300 hover:border-gray-400 bg-white"
                            }
                          `}
                        >
                          {valueStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Estado de variante */}
            {selectedVariant && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="text-green-800 font-medium">Disponible</p>
                    <p className="text-green-600 mt-1">
                      {Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(" • ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedVariant && selectedOptions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">No disponible</p>
                    <p className="text-yellow-600 mt-1">
                      Esta combinación no está disponible
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">Cantidad:</span>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    -
                  </button>
                  <span className="px-3 py-1 min-w-[40px] text-center text-sm border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={quantity >= stockQuantity}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart || !selectedVariant}
                className="w-full bg-orange-500 border border-orange-600 text-white px-4 py-2 rounded text-sm font-normal hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                    Agregando...
                  </>
                ) : isOutOfStock ? (
                  'Agotado'
                ) : !selectedVariant ? (
                  'Selecciona opciones'
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Añadir al carrito
                  </>
                )}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleFavorite}
                  disabled={loadingFav || isOutOfStock}
                  className={`flex-1 border px-4 py-2 rounded text-sm font-normal transition-colors flex items-center justify-center gap-2 ${
                    isFavorite
                      ? "border-red-500 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Heart
                    size={16}
                    className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"}
                  />
                  {isFavorite ? "Guardado" : "Guardar"}
                </button>
              </div>
            </div>

            {isOutOfStock && (
              <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-3">
                <p>Actualmente no disponible.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de detalles adicionales - Versión simplificada */}
<div className="mt-12 space-y-12">
  {/* Recomendados */}
  <div>
    {recommended.length > 0 ? (
      <ProductCarousel products={recommended} title="Los clientes que vieron este producto también vieron" />
    ) : (
      <p className="text-gray-500 text-center">Cargando productos recomendados...</p>
    )}
  </div>

  {/* Reseñas */}
  <div>
    <ProductReviews reviews={mockReviews} averageRating={4.2} totalReviews={mockReviews.length} />
  </div>
</div>
    </div>
  );
}
function setAvailableQuantity(stock: any) {
  throw new Error("Function not implemented.");
}
