/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { cart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
        <p>Agrega productos antes de continuar con la compra.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
    <div className="flex justify-center w-full">
        <CheckoutForm cartItems={cart} />
    </div>
    </div>
  );
}
