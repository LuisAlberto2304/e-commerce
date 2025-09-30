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

type Props = { id: string };

export default function ProductoDetalleClient({ id }: Props) {
  const [producto, setProducto] = useState<any | null>(null);
  const [category, setCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        const productData = await fetchProductById(id);
        const product = productData.product || productData;

        if (!product) throw new Error('Producto no encontrado');

        setProducto(product);

        if (product.category_id) {
          const categoryData = await fetchCategoryById(product.category_id);
          setCategory(categoryData);
        }

        if (product.images?.length > 0) {
          setSelectedImage(product.images[0].url);
        }

        const initialOptions: { [key: string]: string } = {};
        product.options?.forEach((option: any) => {
          if (option.values?.length > 0) {
            initialOptions[option.title] = option.values[0].value;
          }
        });
        setSelectedOptions(initialOptions);

        if (product.variants?.length > 0) {
          setSelectedVariant(product.variants[0]);
        }
      } catch (err) {
        console.error('❌ Error al cargar producto:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [id]);

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

  if (loading) return <div className="max-w-6xl mx-auto p-6 text-center">Cargando producto...</div>;
  if (error) return <div className="max-w-6xl mx-auto p-6 text-center text-red-600">{error}</div>;
  if (!producto) return <div className="max-w-6xl mx-auto p-6 text-center">Producto no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-6">
        {/* 📷 Galería */}
        <div className="w-full">
          <div className="relative bg-gray-100 rounded-2xl flex items-center justify-center">
            {producto.images?.length > 0 ? (
              <>
                <div className="w-full aspect-square sm:aspect-[4/3] flex items-center justify-center">
                  <img
                    src={selectedImage || producto.images[0].url}
                    alt={producto.title}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>

                {/* Controles móviles */}
                {producto.images.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const idx = producto.images.findIndex((img: any) => img.url === selectedImage);
                        const prevIdx = idx === 0 ? producto.images.length - 1 : idx - 1;
                        setSelectedImage(producto.images[prevIdx].url);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md lg:hidden"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => {
                        const idx = producto.images.findIndex((img: any) => img.url === selectedImage);
                        const nextIdx = idx === producto.images.length - 1 ? 0 : idx + 1;
                        setSelectedImage(producto.images[nextIdx].url);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md lg:hidden"
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-gray-400">No hay imagen disponible</div>
            )}
          </div>

          {/* Miniaturas con scroll horizontal en móviles */}
          {producto.images?.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto">
              {producto.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`flex-shrink-0 border-2 rounded-lg p-1 ${
                    selectedImage === img.url ? 'border-emerald-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Vista ${idx + 1}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📖 Info del producto */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{producto.title}</h1>

          <div className="mt-4"><StockStatus quantity={getStockQuantity()} /></div>

          <p className="mt-4 text-gray-600 text-sm sm:text-base">{producto.description || 'No hay descripción disponible'}</p>

          <p className="mt-4 text-xl sm:text-2xl lg:text-3xl text-emerald-600">{getCurrentPrice()}</p>

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
};
