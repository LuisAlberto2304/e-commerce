"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebaseClient";
import { arrayRemove, collection, deleteDoc, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🔹 Estados para país e IVA
  const [country, setCountry] = useState("MX");
  const [taxRate, setTaxRate] = useState(0.16);
  const [tax, setTax] = useState(0);
  const [isDetecting, setIsDetecting] = useState(true);
  const [shipping, setShipping] = useState(0); // 🚚 Definido para evitar error

  const TAX_RATES: Record<string, number> = {
    MX: 0.16,
    PE: 0.18,
    AR: 0.21,
    CL: 0.19,
    ES: 0.21,
    US: 0.07,
  };

  // 🔹 Verificar estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Detectar país automáticamente por IP
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("/api/location");
        const data = await res.json();

        const countryCode = data.country_code || "MX";
        console.log("🌎 País detectado:", data.country_name, countryCode);

        setCountry(countryCode);
        setTaxRate(TAX_RATES[countryCode] ?? 0.16);
      } catch (error) {
        console.error("Error detectando país:", error);
        setCountry("MX");
        setTaxRate(0.16);
      } finally {
        setIsDetecting(false);
      }
    };

    fetchCountry();
  }, []);

  // 🔹 Cargar carrito desde Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 🔹 Cambiado: ahora apunta a la subcolección del usuario
    const cartRef = collection(db, "users", user.uid, "cart");

    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCart(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 🔹 Calcular subtotal, IVA y total
  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );

  useEffect(() => {
    setTax(subtotal * taxRate);
  }, [subtotal, taxRate]);

  const grandTotal = subtotal + tax + shipping;

  // 🔹 Eliminar producto del carrito
  const handleRemove = async (id: string) => {
    if (!user) return;

    try {
      const itemRef = doc(db, "users", user.uid, "cart", id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (!user) return;

    try {
      const itemRef = doc(db, "users", user.uid, "cart", id);
      await updateDoc(itemRef, { quantity: newQuantity });
      console.log("✅ Cantidad actualizada:", newQuantity);
    } catch (error) {
      console.error("❌ Error al actualizar cantidad:", error);
    }
  };

  async function removeFromCart(productId: string) {
    if (!user) {
      alert("Debes iniciar sesión para modificar tu carrito.");
      return;
    }

    try {
      const cartRef = doc(db, "users", user.uid, "cart", productId);
      await deleteDoc(cartRef);

      const cartSnap = await getDoc(cartRef);

      if (!cartSnap.exists()) return;

      const cartData = cartSnap.data();
      const updatedItems = (cartData.items || []).filter(
        (item: any) => item.id !== productId
      );

      await updateDoc(cartRef, { items: updatedItems });

      console.log(`🗑️ Producto con ID ${productId} eliminado del carrito`);
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
      alert("No se pudo eliminar el producto del carrito.");
    }
  }

  // 🔹 Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return <p className="text-center py-10">Verificando autenticación...</p>;
  }

  // 🔹 Mensaje para usuarios no logueados
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu carrito de compras</h1>
        
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Inicia sesión para ver tu carrito</h2>
            <p className="text-gray-600 mb-6">Necesitas estar logueado para acceder a tu carrito de compras y gestionar tus productos.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/login" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Iniciar sesión
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="text-center py-10">Cargando tu carrito...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6" data-testid="cart-item">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu carrito de compras</h1>

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">Descubre productos increíbles y añádelos a tu carrito</p>
            <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
              Comenzar a comprar
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Lista de productos - Columna principal */}
          <div className="lg:flex-1">
            <div className="bg-white rounded-lg shadow-sm border mb-4">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                  </span>
                  <span className="text-sm text-gray-600">Precio</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={`${item.variantId}-${JSON.stringify(item.selectedOptions)}`} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={120}
                          height={120}
                          className="rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h2 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              {item.title}
                            </h2>
                            
                            {/* Mostrar opciones seleccionadas si existen */}
                            {item.variantDescription && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.variantDescription}
                              </p>
                            )}
                            
                            <div className="flex items-center mt-2">
                              <span className="text-sm text-gray-500 mr-2">Cantidad:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  −
                                </button>
                                <span className="px-3 py-1 min-w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className="text-lg font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              ${item.price.toFixed(2)} c/u
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <button
                            onClick={() => removeFromCart(item.variantId!)}
                            className="flex items-center text-sm text-red-700 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4 text-right">
              <p className="text-gray-600">
                Subtotal ({cart.length} {cart.length === 1 ? 'producto' : 'productos'}): 
                <span className="font-semibold text-gray-900 ml-2">${subtotal.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Resumen de compra - Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumen del pedido</h3>
                
                {/* Detección de país */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Enviar a:</span>
                    {isDetecting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-gray-500">Detectando...</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-blue-700">
                        {country === "MX" ? "México" :
                         country === "PE" ? "Perú" :
                         country === "AR" ? "Argentina" :
                         country === "CL" ? "Chile" :
                         country === "ES" ? "España" :
                         country === "US" ? "Estados Unidos" :
                         country}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuestos ({(taxRate * 100).toFixed(0)}%):</span>
                    <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <hr className="my-4 border-gray-200" />

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => {
                    const checkoutData = {
                      subtotal,
                      tax,
                      taxRate,
                      shipping,
                      grandTotal,
                      country,
                      cart,
                    };
                    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
                  }}
                >
                  <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 px-4 rounded-lg font-semibold text-sm transition-colors duration-200 shadow-sm hover:shadow-md flex items-center justify-center" data-testid="pay-now">
                    Proceder al pago
                  </button>
                </Link>
                
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center text-gray-500 text-xs">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pago seguro y cifrado
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}