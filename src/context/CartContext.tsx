/* eslint-disable @typescript-eslint/no-explicit-any */
// context/CartContext.tsx - ACTUALIZAR LA INTERFACE
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  variantId?: string;
  title: string;
  price: number;
  image: string;
  variantDescription?: string;
  quantity: number;
  selectedOptions?: {
    [key: string]: string | undefined;
  };
}

// Interface actualizada con el tipo de retorno correcto
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  shipping: number;
  syncWithMedusa: () => Promise<{ success: boolean; cartId?: string; error?: string }>; // ← TIPO CORREGIDO
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        setCart([]);
      }
    }
  }, []);

  // Guardar carrito cuando cambia
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Sincronizar con Medusa - VERSIÓN SIMPLIFICADA
  const syncWithMedusa = async (): Promise<{ success: boolean; cartId?: string; error?: string }> => {
    if (cart.length === 0) {
      console.log('🛒 Carrito vacío, no hay necesidad de sincronizar');
      return { success: true };
    }
    
    setIsSyncing(true);
    
    try {
      console.log('🔄 Sincronizando carrito con Medusa...', cart.length, 'items');

      // 1. Crear carrito en Medusa
      const cartResponse = await fetch('/api/cart/medusa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!cartResponse.ok) {
        const errorText = await cartResponse.text();
        console.error('❌ Error creando carrito Medusa:', cartResponse.status, errorText);
        return { 
          success: false, 
          error: `Error HTTP ${cartResponse.status}: ${errorText}` 
        };
      }

      const cartData = await cartResponse.json();
      
      if (!cartData.success) {
        console.error('❌ Error en respuesta Medusa:', cartData.error);
        return { 
          success: false, 
          error: cartData.error || 'Failed to create cart' 
        };
      }

      const medusaCart = cartData.cart;
      console.log('✅ Carrito Medusa creado:', medusaCart.id);

      // 2. Agregar items al carrito
      let itemsAdded = 0;
      for (const item of cart) {
        if (item.variantId) {
          try {
            const itemResponse = await fetch('/api/cart/medusa/item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cartId: medusaCart.id,
                variantId: item.variantId,
                quantity: item.quantity
              })
            });

            if (itemResponse.ok) {
              itemsAdded++;
              console.log(`✅ Item ${item.title} agregado al carrito Medusa`);
            }
          } catch (itemError) {
            console.warn(`⚠️ Error agregando item ${item.variantId}:`, itemError);
          }
        }
      }

      console.log(`✅ Carrito sincronizado: ${itemsAdded}/${cart.length} items`);
      
      return { 
        success: true, 
        cartId: medusaCart.id 
      };

    } catch (error: any) {
      console.error('❌ Error sincronizando con Medusa:', error);
      return { 
        success: false, 
        error: error.message || 'Error desconocido' 
      };
    } finally {
      setIsSyncing(false);
    }
  };

  // Cálculos
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const IVA_RATE = 0.16;
  const tax = subtotal * IVA_RATE;
  const shipping = subtotal > 1000 ? 0 : 40;
  const total = subtotal + tax + shipping;

  // Funciones del carrito
  const addToCart = (product: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.variantId === product.variantId &&
          JSON.stringify(item.selectedOptions) === JSON.stringify(product.selectedOptions)
      );

      if (existing) {
        return prev.map((item) =>
          item.variantId === product.variantId &&
          JSON.stringify(item.selectedOptions) === JSON.stringify(product.selectedOptions)
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      return [...prev, { ...product }];
    });
  };

  const removeFromCart = (variantId: string) =>
    setCart((prev) => prev.filter((p) => p.variantId !== variantId));

  const updateQuantity = (variantId: string, quantity: number) =>
    setCart((prev) =>
      prev.map((p) => (p.variantId === variantId ? { ...p, quantity } : p))
    );

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        shipping,
        syncWithMedusa,
        isSyncing,
      }}
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