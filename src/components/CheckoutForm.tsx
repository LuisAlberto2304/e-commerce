/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AddressForm from "./AddressForm";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";


export default function CheckoutForm({ cartItems }: { cartItems: any[] }) {
  const [isGuest, setIsGuest] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
  const [tax, setTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [subtotal, setSubtotal] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [shipping, setShipping] = useState(0);
  const [shippingDetails, setShippingDetails] = useState({
    shippingCost: 0,
    estimatedDays: 0,
    zone: "Desconocida",
  });

  useEffect(() => {
    const savedData = localStorage.getItem("checkoutData");
    if (savedData) {
      const parsed = JSON.parse(savedData);

      // ✅ Reutilizamos los valores del carrito
      setSubtotal(parsed.subtotal || 0);
      setTax(parsed.tax || 0);
      setTaxRate(parsed.taxRate || 0);
      setShipping(parsed.shipping || 0);

      console.log("✅ Datos traídos del carrito:", parsed);
    }
  }, []);

  useEffect(() => {
    if (!city) return;

    const fetchShippingRates = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city }),
        });

        const data = await res.json();
        setShippingOptions(data.rates || []);
      } catch (error) {
        console.error("Error al obtener tarifas de envío:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingRates();
  }, [city]);

  async function calculateShipping(country: string, weight: number) {
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, weight }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error calculando envío:", error);
      return { shippingCost: 0, estimatedDays: 0, zone: "Desconocida" };
    }
  }

  const handleCountryChange = async (newCountry: string, totalWeight: number) => {
    const shippingData = await calculateShipping(newCountry, totalWeight);
    setShipping(shippingData.shippingCost);
    setShippingDetails(shippingData);
  };

  useEffect(() => {
    const savedData = localStorage.getItem("checkoutData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);

      // Aquí extraes y usas el IVA (tax) de la pantalla anterior
      console.log("💰 IVA recibido del carrito:", parsedData.tax);

      // Puedes guardarlo en un estado si lo necesitas en esta pantalla:
      setTax(parsedData.tax);
      setShipping(parsedData.shipping); // opcional
    }
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const calculatedTax = tax > 0 ? tax : subtotal * (taxRate || 0.16);
  const total = subtotal + calculatedTax + shipping;

  const orderData = {
    ...formData,
    items: cartItems,
    guest: isGuest,
    subtotal,
    tax: calculatedTax,
    shipping: shippingDetails.shippingCost,
    shippingZone: shippingDetails.zone,
    estimatedDays: shippingDetails.estimatedDays,
    total,
  };

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  if (res.ok) {
    localStorage.setItem("currentOrder", JSON.stringify(orderData));
    router.push("/payment");
  } else {
    alert("Ocurrió un error al procesar tu compra");
  }

  setIsSubmitting(false);
};


  const getTotalWeight = () => {
    return cartItems.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0);
  };

  return (
    <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 sm:p-10">
        <div className="mb-6">
        <Link href="/cart">
            <p className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm">
            ← Regresar al carrito
            </p>
        </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Finalizar Compra
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
        {isGuest && (
            <>
            <div>
                <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
                >
                Nombre completo
                </label>
                <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
                >
                Correo electrónico
                </label>
                <input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
                >
                Teléfono
                </label>
                <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="55 1234 5678"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            </>
        )}

        <AddressForm 
          formData={formData} 
          handleChange={handleChange} 
          onCountryChange={(country: string) => handleCountryChange(country, getTotalWeight())}
        />


        <div className="text-center">
            <button
                data-testid="continue-to-payment"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                {isSubmitting ? "Procesando..." : "Confirmar compra"}
                </button>
        </div>
        </form>
    </div>
    );
}
function setShipping(shippingCost: any) {
  throw new Error("Function not implemented.");
}

function setShippingDetails(shippingData: any) {
  throw new Error("Function not implemented.");
}

