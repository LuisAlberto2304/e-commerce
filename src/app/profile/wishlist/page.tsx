/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { getWishlistWithDetails } from "@/app/lib/getWishlistWithDetails";
import { removeFromWishlist } from "@/app/lib/wishlist";
import { Trash2, Heart, Clock } from "lucide-react";
import { auth } from "@/app/lib/firebaseClient";
import Image from "next/image";
import { differenceInDays } from "date-fns";

interface Product {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  createdAt: any;
  userId: string;
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<{ [key: string]: string }>({}); // 🔔 recordatorios

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://e-tianguis.com" },
        { "@type": "ListItem", position: 2, name: "Wishlist", item: "https://e-tianguis.com/wishlist" },
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

  // 🔹 Cargar la wishlist del usuario
  useEffect(() => {
    const loadWishlist = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const products = await getWishlistWithDetails(user.uid);
      setWishlist(products);
      setLoading(false);
    };

    loadWishlist();
  }, []);

  useEffect(() => {
    const newReminders: { [key: string]: string } = {};

    wishlist.forEach((item) => {
      if (!item.createdAt) return;

      let created: Date;

      // Si es un Timestamp de Firestore
      if (item.createdAt?.seconds) {
        created = new Date(item.createdAt.seconds * 1000);
      } else if (item.createdAt.toDate) {
        created = item.createdAt.toDate();
      } else {
        // Si es string ISO o Date
        created = new Date(item.createdAt);
      }

      const days = differenceInDays(new Date(), created);

      // ✅ Mostrar recordatorio solo si lleva más de 7 días
      if (days >= 7) {
        newReminders[item.id] = `Este producto lleva ${days} días en tu wishlist 🕒`;
      }
    });

    setReminders(newReminders);
  }, [wishlist]);



  // 🔹 Eliminar de la wishlist
  const handleRemove = async (productId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    await removeFromWishlist(user.uid, productId);
    setWishlist((prev) => prev.filter((p) => p.productId !== productId));
  };

  // 🔹 Estado de carga
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 animate-pulse text-lg">
          Cargando tus favoritos...
        </p>
      </div>
    );

  return (
    <>
     <Head>
        <title>Mis Favoritos | E-Tianguis</title>
        <meta name="description" content="Explora tus productos favoritos en E-Tianguis y descubre ofertas personalizadas." />
        <link rel="canonical" href="https://e-tianguis.com/wishlist" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <div className="max-w-6xl mx-auto p-6">
        {/* 🔹 Título principal */}
        <div className="flex items-center gap-2 mb-8">
          <Heart className="text-pink-500" size={28} />
          <h1 className="text-3xl font-extrabold text-gray-800">
            Mis Favoritos
          </h1>
        </div>

        {/* 🔹 Recordatorio global si hay productos antiguos */}
        {Object.keys(reminders).length > 0 && (
          <div className="mb-6 bg-yellow-100 border border-yellow-300 text-yellow-900 p-4 rounded-2xl flex items-center gap-2 shadow-sm">
            <Clock size={20} />
            <p className="text-sm font-medium">
              Tienes {Object.keys(reminders).length} producto(s) guardado(s) desde hace más de 7 días.
            </p>
          </div>
        )}

        {/* 🔹 Si no hay productos */}
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
            <Heart size={60} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              Aún no tienes productos en tu lista de deseos.
            </p>
            <p className="text-gray-400 text-sm">
              Explora la tienda y guarda tus favoritos aquí ❤️
            </p>
          </div>
        ) : (
          // 🔹 Mostrar productos en la wishlist
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-3xl shadow-md overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleRemove(product.productId)}
                  className="absolute top-3 right-3 bg-white/70 backdrop-blur-md p-2 rounded-full shadow-md text-gray-500 hover:text-red-500 transition z-10"
                  title="Eliminar de favoritos"
                >
                  <Trash2 size={18} />
                </button>

                {/* Enlace al producto */}
                <Link href={`/products/${product.productId}`} className="block">
                  <div className="relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={500}
                      height={400}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-5">
                    <h2 className="font-semibold text-lg text-gray-800 truncate group-hover:text-pink-600 transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-pink-600 font-bold mt-2 text-lg">
                      ${(product.price / 100).toFixed(2)}
                    </p>

                    {reminders[product.id] && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-2 rounded-md flex items-center gap-2">
                        <Clock size={16} />
                        {reminders[product.id]}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
