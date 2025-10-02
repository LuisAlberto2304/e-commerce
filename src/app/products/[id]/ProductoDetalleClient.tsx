/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { fetchProductById, fetchCategoryById } from "@/app/lib/medusaClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import StockStatus from "@/components/StockStatus";
import ProductCarousel from "@/components/ProductCarousel";
import ProductReviews from "@/components/ProductReviews";
import { mockRecommendedProducts, mockReviews } from "@/app/data/mockData";
import Image from "next/image";

type Props = { 
  id: string;
  initialProduct?: any;
  initialCategory?: any;
};

// Funciones helper para manejar imágenes
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
  
  // Imágenes principales
  if (product.images && Array.isArray(product.images)) {
    console.log("✅ Imágenes principales encontradas:", product.images);
    images.push(...product.images);
  }
  
  // Thumbnail como fallback
  if (product.thumbnail && !images.some(img => img.url === product.thumbnail)) {
    console.log("✅ Thumbnail encontrado:", product.thumbnail);
    images.push({ 
      url: product.thumbnail, 
      id: 'thumbnail'
    });
  }
  
  // Si no hay imágenes, buscar en variantes
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
    });
  }
  
  console.log("🖼️ Total de imágenes encontradas:", images.length);
  return images;
};

const getAbsoluteImageUrl = (url: string | undefined | null): string | null => {
  if (!url) {
    console.log("❌ URL de imagen undefined o null");
    return null;
  }
  
  console.log("🔗 Procesando URL:", url);
  
  // Si ya es absoluta
  if (url.startsWith('http')) {
    console.log("✅ URL ya es absoluta");
    return url;
  }
  
  // Si es relativa, prepender base URL de Medusa
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  if (medusaUrl) {
    // Asegurarse de que la URL relativa empiece con /
    const relativeUrl = url.startsWith('/') ? url : `/${url}`;
    const absoluteUrl = `${medusaUrl}${relativeUrl}`;
    console.log("🔗 URL convertida a absoluta:", absoluteUrl);
    return absoluteUrl;
  }
  
  console.log("❌ No se pudo hacer absoluta la URL");
  return url;
};

export default function ProductoDetalleClient({ id, initialProduct, initialCategory }: Props) {
  const [producto, setProducto] = useState<any | null>(initialProduct || null);
  const [category, setCategory] = useState<any | null>(initialCategory || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Obtener imágenes del producto
  const productImages = getProductImages(producto);
  const absoluteSelectedImage = selectedImage ? getAbsoluteImageUrl(selectedImage) : null;

  useEffect(() => {
    // Debug de la estructura del producto
    if (producto) {
      console.log("🔍 ESTRUCTURA COMPLETA DEL PRODUCTO:", JSON.stringify(producto, null, 2));
      console.log("🖼️ Imágenes procesadas:", productImages);
    }
  }, [producto, productImages]);

  useEffect(() => {
    // Si ya tenemos datos iniciales, no hacer fetch
    if (initialProduct) {
      initializeProduct(initialProduct);
      return;
    }

    // Solo hacer fetch si no hay datos iniciales
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
          const categoryData = await fetchCategoryById(product.category_id);
          setCategory(categoryData);
        }
      } catch (err) {
        console.error('❌ Error al cargar producto:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [id, initialProduct]);

  const initializeProduct = (product: any) => {
    setProducto(product);

    // Inicializar imagen seleccionada
    const images = getProductImages(product);
    if (images.length > 0) {
      const firstImageUrl = getAbsoluteImageUrl(images[0].url);
      console.log("🖼️ Estableciendo imagen inicial:", firstImageUrl);
      setSelectedImage(firstImageUrl);
    } else {
      console.log("❌ No hay imágenes disponibles");
      setSelectedImage(null);
    }

    // Inicializar opciones
    const initialOptions: { [key: string]: string } = {};
    product.options?.forEach((option: any) => {
      if (option.values?.length > 0) {
        initialOptions[option.title] = option.values[0].value;
      }
    });
    setSelectedOptions(initialOptions);

    // Inicializar variante
    if (product.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  };

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/category' },
    ...(category ? [{ label: category.name, href: `/categorias/${category.id}` }] : []),
    { label: producto?.title || 'Cargando...' },
  ];

  const getStockQuantity = () =>
    selectedVariant?.inventory_quantity ||
    producto?.variants?.[0]?.inventory_quantity ||
    0;

  const handleOptionChange = (optionTitle: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionTitle]: value };
    setSelectedOptions(newOptions);

    if (producto.variants) {
      const variant = producto.variants.find((v: any) =>
        v.options.every((opt: any) => newOptions[opt.option?.title] === opt.value)
      );
      setSelectedVariant(variant);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariant?.prices?.[0]) {
      return `$${(selectedVariant.prices[0].amount / 100).toFixed(2)}`;
    }
    if (producto?.variants?.[0]?.prices?.[0]) {
      return `$${(producto.variants[0].prices[0].amount / 100).toFixed(2)}`;
    }
    return 'Precio no disponible';
  };

  const handleImageChange = (imageUrl: string) => {
    const absoluteUrl = getAbsoluteImageUrl(imageUrl);
    console.log("🖼️ Cambiando imagen a:", absoluteUrl);
    setSelectedImage(absoluteUrl);
  };

  const handlePrevImage = () => {
    if (productImages.length > 1 && selectedImage) {
      const currentIndex = productImages.findIndex((img: any) => 
        getAbsoluteImageUrl(img.url) === selectedImage
      );
      const prevIndex = currentIndex === 0 ? productImages.length - 1 : currentIndex - 1;
      handleImageChange(productImages[prevIndex].url);
    }
  };

  const handleNextImage = () => {
    if (productImages.length > 1 && selectedImage) {
      const currentIndex = productImages.findIndex((img: any) => 
        getAbsoluteImageUrl(img.url) === selectedImage
      );
      const nextIndex = currentIndex === productImages.length - 1 ? 0 : currentIndex + 1;
      handleImageChange(productImages[nextIndex].url);
    }
  };

  const [imgSrc, setImgSrc] = useState(
    absoluteSelectedImage ||
    getAbsoluteImageUrl(productImages[0]?.url) ||
    "/placeholder-image.jpg"
  );

  if (loading) return <div className="max-w-6xl mx-auto p-6 text-center">Cargando producto...</div>;
  if (error) return <div className="max-w-6xl mx-auto p-6 text-center text-red-600">{error}</div>;
  if (!producto) return <div className="max-w-6xl mx-auto p-6 text-center">Producto no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-6">
      {/* 📷 Galería */}
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
                      setSelectedImage("/placeholder-image.jpg");
                    }}
                    onLoad={() => console.log("✅ Imagen cargada correctamente")}
                  />
                </div>

                {/* Controles móviles */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md lg:hidden z-10"
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md lg:hidden z-10"
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
            <div className="flex gap-3 mt-4 overflow-x-auto">
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
                      src={absoluteUrl || '/placeholder-image.jpg'}
                      alt={`${producto.title} - imagen ${idx + 1}`}
                      className="w-20 h-20 object-contain rounded-lg"
                      onError={(e) => {
                        console.error("❌ Error cargando miniatura:", absoluteUrl);
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 📖 Info del producto */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{producto.title}</h1>

          <div className="mt-4">
            <StockStatus quantity={getStockQuantity()} />
          </div>

          <p className="mt-4 text-gray-600 text-sm sm:text-base">
            {producto.description || 'No hay descripción disponible'}
          </p>

          <p className="mt-4 text-xl sm:text-2xl lg:text-3xl text-emerald-600">
            {getCurrentPrice()}
          </p>

          {/* Cantidad */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="font-semibold">Cantidad:</span>
            <div className="flex items-center border border-gray-300 rounded-lg w-full sm:w-max">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 text-lg hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                disabled={getStockQuantity() === 0}
              >
                -
              </button>
              <span className="px-4 py-3 min-w-[60px] text-center text-base sm:text-lg">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-3 text-lg hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                disabled={quantity >= getStockQuantity()}
              >
                +
              </button>
            </div>
          </div>

          {/* Opciones */}
          {producto.options?.map((option: any) => (
            <div key={option.id} className="mt-6">
              <h2 className="font-semibold mb-2 capitalize">{option.title}</h2>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {option.values.map((value: any) => (
                  <button
                    key={value.id}
                    onClick={() => handleOptionChange(option.title, value.value)}
                    className={`px-4 py-3 rounded-lg text-sm sm:text-base transition 
                      ${
                        selectedOptions[option.title] === value.value
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    {value.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Botones de acción */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-xl text-lg font-medium hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={getStockQuantity() === 0}
            >
              <ShoppingCart size={22} />
              {getStockQuantity() === 0 ? 'Agotado' : 'Añadir al carrito'}
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 border px-6 py-4 rounded-xl text-lg font-medium hover:bg-gray-100 transition">
              <Heart size={22} />
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Recomendados */}
      <div className="mt-12">
        <ProductCarousel products={mockRecommendedProducts} title="También te puede interesar" />
      </div>

      {/* Reseñas */}
      <div className="mt-12">
        <ProductReviews reviews={mockReviews} averageRating={4.2} totalReviews={mockReviews.length} />
      </div>
    </div>
  );
}