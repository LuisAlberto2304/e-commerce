'use client'
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, shipping } = useCart();

  // Estado para país e IVA
  const [country, setCountry] = useState("MX");
  const [taxRate, setTaxRate] = useState(0.16); // México por defecto
  const [tax, setTax] = useState(0);
  const [isDetecting, setIsDetecting] = useState(true);

  const TAX_RATES: Record<string, number> = {
    MX: 0.16, 
    PE: 0.18, // (IGV)
    AR: 0.21, 
    CL: 0.19, 
    ES: 0.21, 
    US: 0.07,
  };

  //Detectar país automáticamente por IP
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const countryCode = data.country_code || "MX";

        console.log("🌎 País detectado:", data.country_name, data.country_code);

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

  // 🔹 Recalcular impuesto al cambiar subtotal o país
  useEffect(() => {
    setTax(subtotal * taxRate);
  }, [subtotal, taxRate]);

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setTaxRate(TAX_RATES[value] ?? 0.16);
  };

  const grandTotal = subtotal + tax + shipping;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
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
              <div key={item.id} className="flex gap-4 border rounded-lg p-4 shadow-sm">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={100}
                  height={100}
                  className="rounded object-cover"
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-gray-600 text-sm">
                    Precio unitario: ${item.price.toFixed(2)}
                  </p>
                  <p className="text-gray-800 font-semibold">
                    Total por producto: ${(item.price * item.quantity).toFixed(2)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-2 border rounded"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 border rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
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

            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              Proceder al pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
