/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AddressForm from "./AddressForm";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const [shipping, setShipping] = useState(0);
  const [shippingDetails, setShippingDetails] = useState({
    shippingCost: 0,
    estimatedDays: 0,
    zone: "Desconocida",
  });
  
  const [tax, setTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  
  // Usar el CartContext para obtener los cálculos actualizados
  const { subtotal: contextSubtotal, tax: contextTax, total: contextTotal } = useCart();

  // ✅ Recuperar datos si hubo un checkout interrumpido
  useEffect(() => {
    const savedProgress = localStorage.getItem("checkout-progress");
    if (savedProgress) {
      const data = JSON.parse(savedProgress);

      if (data.step === "address") {
        setFormData(data.formData || formData);
        setShipping(data.shipping || 0);
        setShippingDetails(data.shippingDetails || {});
        setSubtotal(data.subtotal || 0);
        setTax(data.tax || 0);
        setTaxRate(data.taxRate || 0);
        console.log("🧩 Checkout interrumpido restaurado:", data);
      }
    }
  }, []);

  // ✅ Cargar datos del carrito al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem("checkoutData");
    if (savedData) {
      const parsed = JSON.parse(savedData);

      // Usar los valores del contexto o los guardados
      setSubtotal(contextSubtotal || parsed.subtotal || 0);
      setTax(contextTax || parsed.tax || 0);
      setTaxRate(parsed.taxRate || 0.16);
      setShipping(parsed.shipping || 0);

      console.log("✅ Datos traídos del carrito:", {
        contextSubtotal,
        contextTax,
        parsed
      });
    } else {
      // Si no hay datos guardados, usar el contexto
      setSubtotal(contextSubtotal);
      setTax(contextTax);
      setTaxRate(0.16); // IVA por defecto en México
    }
  }, [contextSubtotal, contextTax]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Calcular envío cuando cambia el país
  async function calculateShipping(country: string, weight: number) {
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, weight }),
      });
      
      if (!res.ok) throw new Error("Error calculando envío");
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error calculando envío:", error);
      return { 
        shippingCost: 0, 
        estimatedDays: 0, 
        zone: "Desconocida",
        method: "Estándar"
      };
    }
  }

  const handleCountryChange = async (newCountry: string, totalWeight: number) => {
    const shippingData = await calculateShipping(newCountry, totalWeight);
    setShipping(shippingData.shippingCost);
    setShippingDetails(shippingData);
  };

  // ✅ Guardar progreso del checkout automáticamente
  useEffect(() => {
    // No guardar si el formulario está vacío
    if (!formData.fullName && !formData.email && !formData.street) return;

    const checkoutProgress = {
      step: "address",
      formData,
      shipping,
      shippingDetails,
      subtotal: contextSubtotal || subtotal,
      tax: contextTax || tax,
      taxRate,
      cartItems,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem("checkout-progress", JSON.stringify(checkoutProgress));
    console.log("💾 Progreso guardado:", checkoutProgress);
  }, [formData, shipping, shippingDetails, contextSubtotal, contextTax, taxRate, cartItems, subtotal, tax]);

  // ✅ Preparar datos para Medusa
  const prepareMedusaData = () => {
    // Separar nombre completo en first_name y last_name
    const nameParts = formData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'Cliente';

    // Preparar dirección para Medusa
    const shippingAddress = {
      first_name: firstName,
      last_name: lastName,
      address_1: formData.street,
      city: formData.city,
      country_code: formData.country === 'México' ? 'mx' : 'us', // Por defecto
      postal_code: formData.postalCode,
      phone: formData.phone,
      province: formData.state // Estado/Provincia
    };

    // Preparar datos del cliente
    const customerData = {
      email: formData.email,
      phone: formData.phone,
      first_name: firstName,
      last_name: lastName
    };

    return {
      shippingAddress,
      customerData,
      email: formData.email,
      shippingOptionId: process.env.NEXT_PUBLIC_MEDUSA_SHIPPING_OPTION_ID || "so_01K5HT9AP08S9T13NQEKCHHJCC"
    };
  };

  // ✅ Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Preparar datos para Medusa
      const medusaData = prepareMedusaData();
      
      // Calcular totales
      const finalSubtotal = contextSubtotal || subtotal;
      const finalTax = contextTax || tax;
      const finalShipping = shipping;
      const finalTotal = finalSubtotal + finalTax + finalShipping;

      // Crear objeto de orden completo
      const orderData = {
        // Información del cliente
        customer: {
          email: formData.email,
          phone: formData.phone,
          fullName: formData.fullName
        },
        
        // Dirección de envío
        shippingAddress: medusaData.shippingAddress,
        
        // Items del carrito
        items: cartItems,
        
        // Totales
        subtotal: finalSubtotal,
        tax: finalTax,
        taxRate: taxRate,
        shipping: finalShipping,
        shippingZone: shippingDetails.zone,
        estimatedDays: shippingDetails.estimatedDays,
        shippingMethod: shippingDetails.method || "Estándar",
        total: finalTotal,
        
        // Metadatos para Medusa
        medusaData: {
          shipping_address: medusaData.shippingAddress,
          email: medusaData.email,
          shipping_option_id: medusaData.shippingOptionId
        },
        
        // Información de la sesión
        guest: isGuest,
        timestamp: new Date().toISOString()
      };

      console.log("📦 Enviando orden a Medusa:", orderData);

      // Guardar orden completa en localStorage
      localStorage.setItem("currentOrder", JSON.stringify(orderData));
      
      // Limpiar progreso de checkout (ya tenemos la orden completa)
      localStorage.removeItem("checkout-progress");
      
      // Guardar también datos específicos para el pago
      localStorage.setItem("payment-preparation", JSON.stringify({
        customerEmail: formData.email,
        shippingAddress: medusaData.shippingAddress,
        shippingOptionId: medusaData.shippingOptionId,
        items: cartItems.map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          title: item.title
        }))
      }));

      console.log("✅ Orden preparada para pago");
      
      // Redirigir a página de pago
      router.push("/payment");

    } catch (error) {
      console.error("❌ Error preparando orden:", error);
      alert("Ocurrió un error al procesar tu compra. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Calcular peso total para envío
  const getTotalWeight = () => {
    return cartItems.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0);
  };

  // ✅ Calcular total actual para mostrar en UI
  const calculateCurrentTotal = () => {
    const currentSubtotal = contextSubtotal || subtotal;
    const currentTax = contextTax || tax;
    return currentSubtotal + currentTax + shipping;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8 sm:p-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <div>
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
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Procesando..." : "Continuar al Pago"}
              </button>
            </div>
          </form>
        </div>

        {/* Resumen de la orden */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen de tu orden</h2>
          
          {/* Items del carrito */}
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.title}</p>
                  {item.variantDescription && (
                    <p className="text-sm text-gray-600">{item.variantDescription}</p>
                  )}
                  <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-800">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${(contextSubtotal || subtotal).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>Envío:</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>IVA ({(taxRate * 100).toFixed(0)}%):</span>
              <span>${(contextTax || tax).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t">
              <span>Total:</span>
              <span>${calculateCurrentTotal().toFixed(2)}</span>
            </div>

            {/* Información de envío */}
            {shippingDetails.zone !== "Desconocida" && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Envío {shippingDetails.method}:</strong>{" "}
                  {shippingDetails.estimatedDays} días aprox. • {shippingDetails.zone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}