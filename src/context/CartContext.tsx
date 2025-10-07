// context/CartContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 🔄 1. Cargar carrito desde localStorage (persistencia local)
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // 💾 2. Guardar carrito cuando cambia
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
        return prev.map((item) =>
            item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        }
        return [...prev, { ...product, quantity: 1 }];
    });
    };


  const removeFromCart = (id: string) => setCart(prev => prev.filter(p => p.id !== id));

  const updateQuantity = (id: string, quantity: number) =>
    setCart(prev => prev.map(p => (p.id === id ? { ...p, quantity } : p)));

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
