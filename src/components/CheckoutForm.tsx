/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AddressForm from "./AddressForm";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";

// IMPORT REMOVIDO: ya no usamos contexto del carrito
// import { useCart } from "@/context/CartContext";

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
    method: "Estándar"
  });
  
  const [tax, setTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0.16);
  const [subtotal, setSubtotal] = useState(0);

  // --- ADAPTADO: ya no usamos useCart ni sus valores
  // const { subtotal: contextSubtotal, tax: contextTax, total: contextTotal } = useCart();

  // ✅ Recuperar datos si hubo un checkout interrumpido
  useEffect(() => {
    const savedProgress = localStorage.getItem("checkout-progress");
    if (savedProgress) {
      const data = JSON.parse(savedProgress);

      if (data.step === "address") {
        setFormData(data.formData || formData);
        setShipping(data.shipping || 0);
        setShippingDetails(data.shippingDetails || { shippingCost: 0, estimatedDays: 0, zone: "Desconocida", method: "Estándar" });
        // ADAPTADO: preferir valores guardados, pero no usar contexto
        setSubtotal(data.subtotal ?? subtotal);
        setTax(data.tax ?? tax);
        setTaxRate(data.taxRate ?? taxRate);
        console.log("🧩 Checkout interrumpido restaurado:", data);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ejecutar solo una vez al montar

  // ✅ Cargar datos del carrito al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem("checkoutData");
    if (savedData) {
      const parsed = JSON.parse(savedData);

      // ADAPTADO: usar los valores guardados en localStorage si existen,
      // y si no, se calcularán desde cartItems en el efecto siguiente.
      setSubtotal(parsed.subtotal ?? subtotal);
      setTax(parsed.tax ?? tax);
      setTaxRate(parsed.taxRate ?? 0.16);
      setShipping(parsed.shipping ?? shipping);

      console.log("✅ Datos traídos del carrito (localStorage):", { parsed });
    } else {
      // Si no hay datos guardados, los calculamos desde cartItems (ver efecto más abajo)
      console.log("ℹ️ No hay checkoutData en localStorage — se usarán cartItems");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar

  // --- ADAPTADO: calcular subtotal y tax desde cartItems
  useEffect(() => {
    const calcSubtotal = cartItems?.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0) ?? 0;
    setSubtotal(calcSubtotal);

    const calcTax = calcSubtotal * (taxRate ?? 0.16);
    setTax(calcTax);

    // opcional: si quieres recalcular shipping basado en subtotal, hazlo aquí
  }, [cartItems, taxRate]);

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

  // ✅ Guardar progreso del checkout automáticamente (mantener)
  useEffect(() => {
    // No guardar si el formulario está vacío
    if (!formData.fullName && !formData.email && !formData.street) return;

    const checkoutProgress = {
      step: "address",
      formData,
      shipping,
      shippingDetails,
      subtotal,
      tax,
      taxRate,
      cartItems,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem("checkout-progress", JSON.stringify(checkoutProgress));
    console.log("💾 Progreso guardado:", checkoutProgress);
  }, [formData, shipping, shippingDetails, subtotal, tax, taxRate, cartItems]);

  // ✅ Preparar datos para Medusa (sin cambios)
  const prepareMedusaData = () => {
    const nameParts = formData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'Cliente';

    const shippingAddress = {
      first_name: firstName,
      last_name: lastName,
      address_1: formData.street,
      city: formData.city,
      country_code: formData.country || 'MX',
      postal_code: formData.postalCode,
      phone: formData.phone,
      province: formData.state
    };

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

  // ✅ Manejar envío del formulario (NO crear orden en Firebase aquí — mantenemos flujo actual)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const medusaData = prepareMedusaData();
      
      // Calcular totales usando los valores calculados desde cartItems
      const finalSubtotal = subtotal;
      const finalTax = tax;
      const finalShipping = shipping;
      const finalTotal = finalSubtotal + finalTax + finalShipping;

      // Crear objeto de orden completo (LOCAL, para pasar a la pasarela)
      const orderData = {
        customer: {
          email: formData.email,
          phone: formData.phone,
          fullName: formData.fullName
        },
        shippingAddress: medusaData.shippingAddress,
        items: cartItems,
        subtotal: finalSubtotal,
        tax: finalTax,
        taxRate: taxRate,
        shipping: finalShipping,
        shippingZone: shippingDetails.zone,
        estimatedDays: shippingDetails.estimatedDays,
        shippingMethod: shippingDetails.method || "Estándar",
        total: finalTotal,
        medusaData: {
          shipping_address: medusaData.shippingAddress,
          email: medusaData.email,
          shipping_option_id: medusaData.shippingOptionId
        },
        guest: isGuest,
        timestamp: new Date().toISOString()
      };

      console.log("📦 Orden preparada (local):", orderData);

      // Guardar orden completa en localStorage como en tu flujo actual
      localStorage.setItem("currentOrder", JSON.stringify(orderData));
      localStorage.removeItem("checkout-progress");

      // Preparación para pago (igual que tenías)
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
    return subtotal + tax + shipping;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart">
            <div className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer group">
              <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al carrito
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Formulario - Lado izquierdo */}
          <div className="xl:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-10">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div className="text-sm font-medium text-blue-600 ml-2">Envío</div>
                </div>
                <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div className="text-sm font-medium text-gray-500 ml-2">Pago</div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Información de envío
              </h1>
              <p className="text-gray-600 text-center mb-8">
                Completa tus datos para finalizar la compra
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {isGuest && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Información personal
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            name="fullName"
                            type="text"
                            placeholder="Nombre completo"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                      transition-all duration-200 bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div>
                          <input
                            name="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                      transition-all duration-200 bg-gray-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <input
                        name="phone"
                        type="tel"
                        placeholder="Número de teléfono"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                <AddressForm 
                  formData={formData} 
                  handleChange={handleChange} 
                  onCountryChange={(country: string) => handleCountryChange(country, getTotalWeight())}
                />

                <div className="pt-4">
                  <button
                    data-testid="continue-to-payment"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold 
                             py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all 
                             duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                             shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Continuar al pago
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Resumen de la orden - Lado derecho */}
          <div className="xl:col-span-5">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header del resumen */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">Resumen de tu pedido</h2>
                  <p className="text-gray-300 text-sm">
                    {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>

                {/* Lista de productos */}
                <div className="p-6 max-h-80 overflow-y-auto">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.title}</p>
                          {item.variantDescription && (
                            <p className="text-sm text-gray-600 mt-1">{item.variantDescription}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Cantidad: {item.quantity}</span>
                            <span className="font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detalles del precio */}
                <div className="border-t border-gray-100 p-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>
                      {shipping === 0 ? "GRATIS" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>IVA ({(taxRate * 100).toFixed(0)}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>${calculateCurrentTotal().toFixed(2)}</span>
                  </div>

                  {/* Información de envío */}
                  {shippingDetails.zone !== "Desconocida" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Envío {shippingDetails.method}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Llega en {shippingDetails.estimatedDays} días • {shippingDetails.zone}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Garantías */}
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">Pago seguro</p>
                    </div>
                    <div>
                      <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">Envío rápido</p>
                    </div>
                    <div>
                      <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">Garantía</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
