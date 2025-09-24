// app/products/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, Heart } from 'lucide-react';
import { fetchProductById, fetchCategoryById } from '@/app/lib/medusaClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import StockStatus from '@/components/StockStatus';

const ProductoDetallePage = () => {
  const params = useParams();
  const id = params.id as string;

  const [producto, setProducto] = useState<any | null>(null);
  const [category, setCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{[key: string]: string}>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Cargar producto y categoría
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar producto
        const productData = await fetchProductById(id);
        const product = productData.product || productData;
        
        if (!product) {
          throw new Error('Producto no encontrado');
        }

        setProducto(product);
        
        // Cargar categoría si existe
        if (product.category_id) {
          const categoryData = await fetchCategoryById(product.category_id);
          setCategory(categoryData);
        }

        // Inicializar estados
        if (product.images && product.images.length > 0) {
          setSelectedImage(product.images[0].url);
        }

        const initialOptions: {[key: string]: string} = {};
        if (product.options) {
          product.options.forEach((option: any) => {
            if (option.values && option.values.length > 0) {
              initialOptions[option.title] = option.values[0].value;
            }
          });
          setSelectedOptions(initialOptions);
        }

        if (product.variants && product.variants.length > 0) {
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

  // Generar breadcrumbs
  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/category' },
    ...(category ? [{ label: category.name, href: `/categorias/${category.id}` }] : []),
    { label: producto?.title || 'Cargando...' }
  ];

  // Obtener cantidad en stock
  const getStockQuantity = () => {
    return selectedVariant?.inventory_quantity || 
           producto?.variants?.[0]?.inventory_quantity || 
           0;
  };

  const handleOptionChange = (optionTitle: string, value: string) => {
    const newOptions = {
      ...selectedOptions,
      [optionTitle]: value
    };
    setSelectedOptions(newOptions);

    if (producto.variants) {
      const variant = producto.variants.find((v: any) => {
        return v.options.every((opt: any) => 
          newOptions[opt.option?.title] === opt.value
        );
      });
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

  if (loading) return (
    <div className="max-w-6xl mx-auto p-6">
      <p className="text-center text-lg">Cargando producto...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-6xl mx-auto p-6">
      <p className="text-center text-red-600 text-lg">{error}</p>
    </div>
  );

  if (!producto) return (
    <div className="max-w-6xl mx-auto p-6">
      <p className="text-center text-lg">Producto no encontrado</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 🧭 Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid md:grid-cols-2 gap-10">
        
        {/* 📷 Galería de imágenes */}
        <div>
          <div className="flex items-center justify-center bg-gray-100 rounded-2xl p-6 min-h-[400px]">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={producto.title}
                width={500}
                height={500}
                className="rounded-lg object-cover max-h-[400px]"
              />
            ) : (
              <div className="text-gray-400">No hay imagen disponible</div>
            )}
          </div>
          
          {producto.images && producto.images.length > 1 && (
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
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📖 Información del producto */}
        <div>
          <h1 className="text-4xl font-bold">{producto.title || 'Sin título'}</h1>
          
          {/* 📊 Stock Status */}
          <div className="mt-4">
            <StockStatus quantity={getStockQuantity()} />
          </div>
          
          <p className="mt-4 text-gray-600">
            {producto.description || 'No hay descripción disponible'}
          </p>

          {/* 💰 Precio */}
          <p className="mt-6 text-3xl font-semibold text-emerald-600">
            {getCurrentPrice()}
          </p>

          {/* 🔢 Selector de Cantidad */}
          <div className="flex items-center space-x-3 mt-4">
            <span className="font-semibold">Cantidad:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                disabled={getStockQuantity() === 0}
              >
                -
              </button>
              <span className="px-4 py-2 min-w-[50px] text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                disabled={quantity >= getStockQuantity()}
              >
                +
              </button>
            </div>
          </div>

          {/* 🎨 Opciones del producto */}
          {producto.options && producto.options.map((option: any) => (
            <div key={option.id} className="mt-6">
              <h2 className="font-semibold mb-2 capitalize">{option.title}</h2>
              <div className="flex gap-3 flex-wrap">
                {option.values.map((value: any) => (
                  <button
                    key={value.id}
                    onClick={() => handleOptionChange(option.title, value.value)}
                    className={`px-4 py-2 border rounded-lg transition ${
                      selectedOptions[option.title] === value.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {value.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* 🛒 Botones */}
          <div className="mt-8 flex gap-4">
            <button 
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={getStockQuantity() === 0}
            >
              <ShoppingCart size={20} /> 
              {getStockQuantity() === 0 ? 'Agotado' : 'Añadir al carrito'}
            </button>
            <button className="flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 transition">
              <Heart size={20} /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetallePage;