/* eslint-disable @next/next/inline-script-id */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ProductCard } from '../components/ProductCard';
import { BannerCarousel } from '../components/Banner';
import CookieBanner from '../components/CookieBanner';
import Script from 'next/script';
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from './lib/firebaseClient';
import Link from 'next/link';
import { getNewestProducts, getBestSellingProducts, Product } from '@/app/services/firebaseService';
import { testFirestore } from "@/app/services/testFirestore";
import { useNewestProducts, useBestSellingProducts } from '@/hooks/useHomeProducts';

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://e-tianguis.com" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-Tianguis",
    url: "https://e-tianguis.com",
    logo: "https://e-tianguis.com/logo.png",
  },
];


export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  const { data: newestProducts = [], isLoading: loadingNewest, error: errorNewest } = useNewestProducts();
  const { data: bestSellingProducts = [], isLoading: loadingBestSelling, error: errorBestSelling } = useBestSellingProducts();

  const loading = loadingNewest || loadingBestSelling;
  const error = errorNewest ? (errorNewest as Error).message : (errorBestSelling ? (errorBestSelling as Error).message : null);

  useEffect(() => {
    if (newestProducts.length === 0 && !loading && !error) {
      // Optional: Log if empty but no error
    }
  }, [newestProducts, loading, error]);

  const banners = [
    {
      title: "Oferta Especial",
      subtitle: "Aprovecha un 30% de descuento.",
      imageUrl: "https://png.pngtree.com/png-clipart/20231014/original/pngtree-heap-of-colorful-clothes-mountain-picture-image_13153143.png",
    },
    {
      title: "Nueva Colección",
      subtitle: "Ropa deportiva ya disponible.",
      imageUrl: "https://www.oxiclean.com/-/media/oxiclean/content/product-images/color-shirts.png",
    },
    {
      title: "Ropa para el trabajo",
      subtitle: "Para la chamba",
      imageUrl: "https://www.lakeland.com/wp-content/uploads/hi-vis-vest.png",
    },
  ];

  // Función para formatear el precio
  const formatPrice = (price: number) => {
    // Si el precio es muy alto, probablemente está en centavos
    if (price > 1000) {
      return (price / 100).toFixed(2);
    }
    return price.toFixed(2);
  };

  useEffect(() => {
    testFirestore();
  }, []);

  // Estado de carga mejorado
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown mx-auto mb-4"></div>
          <p className="text-text text-lg">Buscando productos...</p>
          <p className="text-gray-500 text-sm mt-2">Revisando todas las tiendas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section>
        <BannerCarousel items={banners} />
        {/* 🔹 Bloque de bienvenida si NO hay sesión */}
        {!user && (
          <div className="bg-white text-black p-6 text-center rounded-xl mx-auto mt-6 w-[90%] md:w-[70%] shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">¡Bienvenido a E-Tianguis!</h2>
            <p className="mb-4">
              Crea una cuenta o inicia sesión para disfrutar ofertas personalizadas, guardar tus favoritos y mucho más.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/login">
                <button className="bg-brown text-white hover:bg-rosa px-6 py-2 rounded-lg transition">
                  Iniciar sesión
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-white border border-brown text-brown hover:bg-rosa hover:text-white px-6 py-2 rounded-lg transition">
                  Registrarse
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* 🔹 Mensaje de error */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl mx-auto mt-6 w-[90%] md:w-[70%]">
            <h3 className="text-lg font-semibold mb-2">Aviso</h3>
            <p>{error}</p>
            <p className="text-sm mt-2">Abre la consola del navegador (F12) para ver logs detallados.</p>
          </div>
        )}

        {/* 🔹 Productos más nuevos */}
        <div className="mt-16">
          <h2 className="text-4xl md:text-6xl text-center font-heading text-text mb-10">
            Productos Más Nuevos
          </h2>

          {newestProducts.length > 0 ? (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 justify-items-center">
                {newestProducts.map((product) => (
                  <div key={`${product.store_id}-${product.id}`} className="w-full max-w-[300px]">
                    <ProductCard
                      id={product.id}
                      title={product.title}
                      description={product.description}
                      price={formatPrice(product.price)}
                      imageUrl={product.thumbnail}
                    />
                    <div className="text-xs text-gray-500 mt-2">
                      Creado: {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No se encontraron productos nuevos.</p>
              <p className="text-sm text-gray-500 mt-2">
                Verifica que haya productos publicados en Firebase Firestore.
              </p>
            </div>
          )}
        </div>
        {/* 🔹 Productos más vendidos (temporalmente iguales) */}
        <div className="mt-16">
          <h2 className="text-4xl md:text-6xl text-center font-heading text-text mb-10">
            Productos Destacados
          </h2>

          {bestSellingProducts.length > 0 ? (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 justify-items-center">
                {bestSellingProducts.map((product) => (
                  <div key={`best-${product.store_id}-${product.id}`} className="w-full max-w-[300px]">
                    <ProductCard
                      id={product.id}
                      title={product.title}
                      description={product.description}
                      price={formatPrice(product.price)}
                      imageUrl={product.thumbnail}
                    />

                    <div className="text-xs text-gray-500 mt-2">
                      Vendidos: {product.totalSold ?? 0}
                    </div>

                    <div className="text-xs text-gray-400">
                      Última venta: {product.lastSell ? new Date(product.lastSell).toLocaleDateString() : "-"}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No se encontraron productos destacados.</p>
            </div>
          )}
        </div>
      </section>

      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <CookieBanner
        facebookPixelId={process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
        gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
      />
    </>
  );
}