'use client'

import React from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-3xl font-semibold mb-3">Tu carrito está vacío 🛒</h1>
        <p className="text-gray-500 mb-6">
          Agrega productos desde la tienda para verlos aquí.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center sm:text-left">
        Carrito de compras
      </h1>

      <div className="space-y-6">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row items-center gap-6 bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-lg transition-shadow duration-200"
          >
            {/* Imagen del producto */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 128px, 144px"
                  className="object-cover object-center transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="font-semibold text-xl text-gray-800 mb-1 break-words">
                {item.title}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Precio unitario: <span className="font-medium">${item.price.toFixed(2)}</span>
              </p>

              {/* Controles de cantidad */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 active:scale-95 transition disabled:opacity-50"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="font-medium min-w-[20px] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 active:scale-95 transition"
                >
                  +
                </button>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-600 font-medium text-sm transition"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="text-lg font-semibold text-gray-800 mt-4 md:mt-0">
              ${ (item.price * item.quantity).toFixed(2) }
            </div>
          </div>
        ))}
      </div>

      {/* Total y acciones */}
      <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-gray-200 pt-6">
        <button
          onClick={clearCart}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 active:scale-95 transition shadow-sm hover:shadow-md"
        >
          Vaciar carrito
        </button>

        <div className="text-3xl font-bold text-gray-800 text-center">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      {/* Botón de checkout */}
      <div className="mt-8 flex justify-center md:justify-end">
        <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 active:scale-95 transition shadow-sm hover:shadow-md">
          Proceder al pago
        </button>
      </div>
    </div>
  );
}
