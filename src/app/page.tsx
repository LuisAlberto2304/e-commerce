"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/inline-script-id */
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { BannerCarousel } from '../components/Banner';
import CookieBanner from '../components/CookieBanner';
import { generateSeoMetadata } from "./lib/seo";
import Script from 'next/script';
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { Auth } from 'firebase/auth';
import { useEffect, useState } from "react";
import { auth } from './lib/firebaseClient';
import Link from 'next/link';

// 🔹 Datos estructurados para la página principal
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
  // Productos destacados
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Product",
        name: "Producto 1",
        description: "Descripción corta",
        image: "https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png",
        sku: "PROD1",
        offers: {
          "@type": "Offer",
          url: "https://e-tianguis.com",
          priceCurrency: "MXN",
          price: "10.00",
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "Product",
        name: "Producto 2",
        description: "Descripción corta",
        image: "https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png",
        sku: "PROD2",
        offers: {
          "@type": "Offer",
          url: "https://e-tianguis.com",
          priceCurrency: "MXN",
          price: "20.00",
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "Product",
        name: "Producto 3",
        description: "Descripción corta",
        image: "https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png",
        sku: "PROD3",
        offers: {
          "@type": "Offer",
          url: "https://e-tianguis.com",
          priceCurrency: "MXN",
          price: "30.00",
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/InStock",
        },
      },
    ],
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

  const products = [
    { id: 'PROD1', title: 'Producto 1', description: 'Descripción corta', price: '10', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png'},
    { id: 'PROD2', title: 'Producto 2', description: 'Descripción corta', price: '20', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png'},
    { id: 'PROD3', title: 'Producto 3', description: 'Descripción corta', price: '30', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png'},
  ];

  const banners = [
    {
      title: "Oferta Especial",
      subtitle: "Aprovecha un 30% de descuento.",
      buttonText: "Comprar ahora",
      imageUrl: "https://png.pngtree.com/png-clipart/20231014/original/pngtree-heap-of-colorful-clothes-mountain-picture-image_13153143.png",
    },
    {
      title: "Nueva Colección",
      subtitle: "Ropa deportiva ya disponible.",
      buttonText: "Ver colección",
      imageUrl: "https://www.oxiclean.com/-/media/oxiclean/content/product-images/color-shirts.png",
    },
    {
      title: "Ropa para el trabajo",
      subtitle: "Para la chamba",
      buttonText: "Descubrir",
      imageUrl: "https://www.lakeland.com/wp-content/uploads/hi-vis-vest.png",
    },
  ];

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

        <h2 className="text-6xl text-center font-heading text-text mb-10 mt-10">
          Productos destacados
        </h2>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
            {products.map((product) => (
              <div key={product.id} className="w-full max-w-[280px]">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.img}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* 🔹 Insertar JSON-LD */}
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Agregar cookie baner al final */}
      <CookieBanner 
        facebookPixelId={process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
        gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
      />
    </>
  );
}