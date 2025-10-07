"use client";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export const MiniCart = () => {
  const { cart, total, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // 🔹 Cerrar el mini-cart si el usuario hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={cartRef}>
      {/* 🔹 Botón del carrito */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-1 hover:text-blue-600 transition"
        aria-label="Carrito de compras"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9m-6-9v9"
          />
        </svg>

        {/* 🔹 Contador de productos */}
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* 🔹 Mini-cart desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white shadow-xl rounded-lg border border-gray-200 z-50 animate-fadeIn">
          <div className="p-3">
            <h3 className="text-lg font-semibold mb-2">Tu carrito</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay productos aún.</p>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">${item.price}</p>
                        <div className="flex items-center mt-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, Math.max(1, item.quantity - 1))
                            }
                            className="px-2 text-gray-600 hover:text-black"
                          >
                            −
                          </button>
                          <span className="text-sm mx-1">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-2 text-gray-600 hover:text-black"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-3 text-sm">
              <div className="flex justify-between font-semibold mb-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link
                href="/cart"
                className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                onClick={() => setIsOpen(false)}
              >
                Ir al carrito
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
