/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CheckoutForm from "@/components/CheckoutForm";
import { db, auth } from "../lib/firebaseClient";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 🔹 Detectar usuario actual
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setCart([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 🔹 Escuchar carrito del usuario en tiempo real desde la subcolección
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // ✅ La ruta correcta del carrito:
    const cartRef = collection(db, "users", userId, "cart");

    const unsubscribe = onSnapshot(
      cartRef,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCart(items);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error obteniendo carrito:", error);
        setCart([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // 🔹 Estados visuales
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando tu carrito...
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">
          Debes iniciar sesión para continuar
        </h2>
        <p>Por favor, inicia sesión para proceder con el pago.</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
        <p>Agrega productos antes de continuar con la compra.</p>
      </div>
    );
  }

  // 🔹 Enviar carrito al formulario
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="flex justify-center w-full">
        <CheckoutForm cartItems={cart} />
      </div>
    </div>
  );
}
