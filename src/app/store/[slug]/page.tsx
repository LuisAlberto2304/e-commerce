/* eslint-disable @typescript-eslint/no-explicit-any */
// app/store/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {ProductCard , CardProps} from '@/components/ProductCard';
import { Search, Filter, Store, Mail, Phone, MapPin, ShoppingBag, Star, Users } from 'lucide-react';

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando tienda:', slug);
        
        const response = await fetch(`/api/store/${slug}/products`);
        console.log('📨 Status:', response.status);
        
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `No se encontró la tienda "${slug}"`
          );
        }
        
        if (!response.ok) {
          throw new Error(`Error ${response.status} al cargar la tienda`);
        }

        const result = await response.json();
        console.log('✅ Datos recibidos:', result);
        setData(result);

      } catch (error: any) {
        console.error('❌ Error:', error);
        
        try {
          const response = await fetch(`/api/store/${slug}/products`);
          const errorData = await response.json();
          if (errorData.available_stores) {
            setAvailableStores(errorData.available_stores);
          }
        } catch (e) {
          // Ignorar error secundario
        }
        
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price / 100);
  };

  // Filtrar y ordenar productos
  const filteredProducts = data?.products?.filter((product: any) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
      default:
        return a.title.localeCompare(b.title);
    }
  });

  // Convertir productos al formato de ProductCard
  const productCards: CardProps[] = sortedProducts.map((product: any) => ({
    id: product.id,
    title: product.title,
    description: product.description || '',
    imageUrl: product.thumbnail,
    price: formatPrice(product.price),
    originalPrice: product.originalPrice,
    label: product.label,
    variants: product.variants
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando {slug}...</p>
          <p className="text-gray-400 text-sm mt-2">Preparando tu experiencia de compra</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h1>
          <p className="text-gray-600 mb-6 text-sm md:text-base">{error}</p>
          
          {(availableStores.length > 0 || !slug) && (
            <div className="space-y-3 text-sm text-gray-500 mb-6">
              <p className="font-medium">Tiendas disponibles:</p>
              <div className="flex flex-col gap-2">
                {availableStores.map(store => (
                  <Link 
                    key={store} 
                    href={`/store/${store}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors text-sm md:text-base"
                  >
                    /store/{store}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm md:text-base"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header mejorado - Responsivo */}
      <header className="bg-white shadow-sm border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
              <Store className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              {data?.store_info?.name}
            </h1>
            
            {data?.store_info?.description && (
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4 md:mb-6 leading-relaxed px-4">
                {data.store_info.description}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6 text-xs md:text-sm text-gray-500 mt-4 md:mt-6 px-2">
              <div className="flex items-center bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm">
                <ShoppingBag className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-indigo-500" />
                <span>{data?.count || 0} productos</span>
              </div>
              
              {data?.store_info?.email && (
                <div className="flex items-center bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-indigo-500" />
                  <span className="hidden sm:inline">{data.store_info.email}</span>
                  <span className="sm:hidden">Contactar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* Barra de búsqueda y filtros - Mejorada para móvil */}
        <section className="mb-8 md:mb-12">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {/* Búsqueda */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm md:text-base"
                  />
                </div>
              </div>
              
              {/* Filtros y contador */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg md:rounded-xl px-3 py-2.5 md:py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm md:text-base"
                  >
                    <option value="name">Ordenar por nombre</option>
                    <option value="price-low">Precio: menor a mayor</option>
                    <option value="price-high">Precio: mayor a menor</option>
                  </select>
                </div>
                
                <div className="text-xs md:text-sm text-gray-500 bg-gray-100 px-3 py-2 md:px-4 md:py-2 rounded-full text-center sm:text-left">
                  {sortedProducts.length} {sortedProducts.length === 1 ? 'producto' : 'productos'} encontrados
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de productos - Grid responsivo */}
        <section className="mb-12 md:mb-16">
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {productCards.map((product, index) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  priority={index < 4}
                  className="w-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4 md:mb-6 text-sm md:text-base">
                {searchTerm 
                  ? `No encontramos productos que coincidan con "${searchTerm}". Intenta con otros términos.`
                  : `${data?.store_info?.name} aún no tiene productos publicados en su catálogo.`
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-5 py-2.5 md:px-6 md:py-3 bg-indigo-600 text-white rounded-lg md:rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm md:text-base"
                >
                  Ver todos los productos
                </button>
              )}
            </div>
          )}
        </section>

        {/* Información de la tienda - Responsiva */}
        <section className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-4 md:px-8 md:py-6">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white text-center">
              Sobre {data?.store_info?.name}
            </h3>
          </div>
          
          <div className="p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Store className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Tienda</h4>
                <p className="text-xs md:text-sm text-gray-600">Activa y verificada</p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Productos</h4>
                <p className="text-xs md:text-sm text-gray-600">{data?.count || 0} publicados</p>
              </div>
              
              {data?.store_info?.email && (
                <div className="text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Contacto</h4>
                  <p className="text-xs md:text-sm text-gray-600 break-all">{data.store_info.email}</p>
                </div>
              )}
            </div>
            
            {/* Información adicional - Responsiva */}
            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs md:text-sm text-gray-600">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Información de contacto</h5>
                  <div className="space-y-1.5 md:space-y-2">
                    {data?.store_info?.email && (
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3 text-gray-400 flex-shrink-0" />
                        <span className="break-all">{data.store_info.email}</span>
                      </div>
                    )}
                    {data?.store_info?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3 text-gray-400 flex-shrink-0" />
                        <span>{data.store_info.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Detalles de la tienda</h5>
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3 text-yellow-400 fill-current flex-shrink-0" />
                      <span>Tienda verificada</span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingBag className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3 text-gray-400 flex-shrink-0" />
                      <span>{data?.count || 0} productos en stock</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}