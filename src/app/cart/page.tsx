"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebaseClient";
import { arrayRemove, collection, deleteDoc, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const user = auth.currentUser;
    if (!user) return;

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
  }, []);


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
    const user = auth.currentUser;
    if (!user) return;

    try {
      const user = auth.currentUser;
      if (!user) return;
      const itemRef = doc(db, "users", user.uid, "cart", id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      const user = auth.currentUser;
      if (!user) return;
      const itemRef = doc(db, "users", user.uid, "cart", id);

      await updateDoc(itemRef, { quantity: newQuantity });
      console.log("✅ Cantidad actualizada:", newQuantity);
    } catch (error) {
      console.error("❌ Error al actualizar cantidad:", error);
    }
  };



  if (loading) {
    return <p className="text-center py-10">Cargando tu carrito...</p>;
  }

  
  async function removeFromCart(productId: string) {
    const user = auth.currentUser;

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

  return (
    <div className="max-w-5xl mx-auto py-10 px-4" data-testid="cart-item">
      <h1 className="text-2xl font-bold mb-6">Tu carrito</h1>

      {cart.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>Tu carrito está vacío.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Volver a la tienda
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.variantId}-${JSON.stringify(item.selectedOptions)}`} className="flex gap-4 border rounded-lg p-4 shadow-sm">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={100}
                  height={100}
                  className="rounded object-cover"
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{item.title}</h2>
                  
                  {/* Mostrar opciones seleccionadas si existen */}
                  {item.variantDescription && (
                    <p className="text-gray-600 text-sm mt-1">
                      {item.variantDescription}
                    </p>
                  )}
                  
                  <p className="text-gray-600 text-sm">
                    Precio unitario: ${item.price.toFixed(2)}
                  </p>
                  <p className="text-gray-800 font-semibold">
                    Total por producto: ${(item.price * item.quantity).toFixed(2)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="px-3">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.variantId!)}
                    className="text-red-500 text-sm mt-2 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 💰 Resumen */}
          <div className="border rounded-lg p-4 bg-gray-50 shadow-md h-fit">
            <h3 className="font-semibold text-lg mb-3">Resumen de compra</h3>

            {/* Estado de detección */}
            {isDetecting ? (
              <p className="text-sm text-gray-500 mb-3">Detectando tu país...</p>
            ) : (
              <>
                <label className="text-sm font-medium mb-1 block">
                  País detectado:
                </label>
                <input
                  type="text"
                  value={
                    country === "MX" ? "México" :
                    country === "PE" ? "Perú" :
                    country === "AR" ? "Argentina" :
                    country === "CL" ? "Chile" :
                    country === "ES" ? "España" :
                    country === "US" ? "Estados Unidos" :
                    country
                  }
                  disabled
                  className="border p-2 rounded w-full mb-4 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </>
            )}


            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos ({(taxRate * 100).toFixed(0)}%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío estimado:</span>
                <span>{shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}</span>
              </div>
            </div>

            <hr className="my-3" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
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
              <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer" data-testid="pay-now">
                Proceder al pago
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
