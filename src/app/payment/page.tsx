"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";
import { loadStripe, PaymentIntent } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import PayPalButton from "@/components/PayPalButton";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { saveOrder } from "../lib/orders";
import { useAuth } from "@/context/userContext";
import { 
  getCartFromFirebase, 
  clearCartFromFirebase, 
  calculateCartTotals 
} from "../lib/firebaseCart";
import router from "next/router";
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function StripeCheckout({ order, totalWithTax, onSuccess }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 1️⃣ Crear PaymentIntent en backend
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(totalWithTax * 100), // centavos
          currency: "mxn",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 2️⃣ Confirmar pago con Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("No se encontró el elemento de tarjeta");

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { email: order.customerEmail || "guest@example.com" },
        },
      });

      if (result.error) {
        setError(result.error.message || "Error al procesar el pago");
        router.push("/failure");
        return;
      }

        if (result.paymentIntent?.status === "succeeded") {
          onSuccess({ paymentIntent: result.paymentIntent }, "stripe");
        }
    } catch (err: any) {
      setError(err.message);
      console.error("Error Stripe:", err);
      router.push("/failure");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripePayment}>
      <CardElement className="border p-3 rounded-md mb-4" />
      <button
        type="submit"
        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={isProcessing || !stripe}
      >
        {isProcessing ? "Procesando..." : "Pagar con tarjeta"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}


export default function PaymentPage() {
  const [order, setOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(0);
  const [shippingMethod, setShippingMethod] = useState<string>("Estándar");
  const [iva, setIva] = useState<number>(0);
  const { user } = useAuth();
  // Agrega esto junto a tus otros useState()
  const [hasSynced, setHasSynced] = useState(false);
  const router = useRouter();
  
  // Nuevos estados para Firebase
  const [cart, setCart] = useState<any[]>([]);
  const [cartTotals, setCartTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
    shipping: 0
  });

  

  // ✅ Cargar carrito desde Firebase
  useEffect(() => {
    const loadCartData = async () => {
      if (user?.uid) {
        try {
          const cartData = await getCartFromFirebase(user.uid);
          setCart(cartData.items || []);
          
          // Calcular totales
          const totals = calculateCartTotals(cartData.items);
          setCartTotals(totals);
        } catch (error) {
          console.error("Error cargando carrito desde Firebase:", error);
        }
      }
    };

    loadCartData();
  }, [user]);

    // ✅ NUEVO CÓDIGO - sin isSyncing
    useEffect(() => {
    const initializeCart = async () => {
      if (cart.length > 0 && !hasSynced) {
        try {
          console.log('🔄 Inicializando carrito desde Firebase...');
          setHasSynced(true);
        } catch (error) {
          console.error('❌ Error inicializando carrito:', error);
          setHasSynced(true);
        }
      } else if (!hasSynced) {
        setHasSynced(true);
      }
    };

    initializeCart();
  }, [cart, hasSynced]);

  // ✅ Crear carrito en Medusa usando datos de Firebase
  const createMedusaOrder = async () => {
    try {
      // 1. Crear carrito en Medusa
      const cartRes = await fetch("/api/medusa/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const medusaCart = await cartRes.json();
      const cartId = medusaCart?.cart?.id;

      if (!cartId) throw new Error("No se pudo crear el carrito en Medusa");

      // 2. Agregar productos al carrito de Medusa desde Firebase
      const cartItemsRes = await fetch("/api/medusa/cart-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          items: cart.map(item => ({
            variant_id: item.variantId || item.id, // Ajusta según tu estructura
            quantity: item.quantity,
          })),
        }),
      });

      const cartItemsData = await cartItemsRes.json();
      if (!cartItemsData.success) {
        throw new Error("No se pudieron agregar los productos al carrito de Medusa");
      }

      console.log('✅ Productos agregados al carrito de Medusa desde Firebase');
      return cartId;

    } catch (error) {
      console.error('❌ Error creando orden en Medusa:', error);
      throw error;
    }
  };

  // ✅ Guardar progreso del pago automáticamente
  useEffect(() => {
    if (!order) return;

    const paymentProgress = {
      step: "payment",
      order,
      paymentMethod,
      shippingMethod,
      shippingCost,
      estimatedDays,
      iva,
      cartItems: cart, // Guardar items del carrito
    };

    localStorage.setItem("payment-progress", JSON.stringify(paymentProgress));
  }, [order, paymentMethod, shippingMethod, shippingCost, estimatedDays, iva, cart]);

  // ✅ Recuperar progreso del pago si el checkout fue interrumpido
  useEffect(() => {
    const savedPaymentProgress = localStorage.getItem("payment-progress");

    if (savedPaymentProgress) {
      const data = JSON.parse(savedPaymentProgress);
      if (data.step === "payment") {
        setOrder(data.order || null);
        setPaymentMethod(data.paymentMethod || "card");
        setShippingMethod(data.shippingMethod || "Estándar");
        setShippingCost(data.shippingCost || 0);
        setEstimatedDays(data.estimatedDays || 0);
        setIva(data.iva || 0);
        setCart(data.cartItems || []);

        console.log("🧩 Pago interrumpido restaurado:", data);
      }
    }
  }, []);

  // Recuperar el pedido desde localStorage
  useEffect(() => {
    const savedPaymentProgress = localStorage.getItem("payment-progress");
    if (savedPaymentProgress) return;

    const savedOrder = localStorage.getItem("currentOrder");
    if (savedOrder) {
      const parsedOrder = JSON.parse(savedOrder);
      setOrder(parsedOrder);
      setShippingCost(parsedOrder.shipping || 0);
      setEstimatedDays(parsedOrder.estimatedDays || 0);
      setShippingMethod(parsedOrder.shippingMethod || "Estándar");
      setIva(parsedOrder.iva || 0);
    } else {
      window.location.href = "/checkout";
    }
  }, []);

  // Calcular envío cuando cambie método (se mantiene igual)
  const updateShipping = async (method: string, countryOverride?: string) => {
    try {
      const savedOrder = JSON.parse(localStorage.getItem("currentOrder") || "{}");
      const savedAddress = JSON.parse(localStorage.getItem("shippingAddress") || "{}");

      const country =
        order?.country ||
        savedOrder?.country ||
        savedAddress?.country_code ||
        "México"; // valor por defecto

      if (!country) {
        console.warn("⚠️ Falta el campo country en la orden.");
        return;
      }

      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          city: order?.city || "Otro",
          weight: cart.reduce(
            (acc: number, i: any) => acc + (i.weight || 0) * i.quantity,
            0
          ),
          method,
        }),
      });

      if (!res.ok) {
        console.error("❌ Error al calcular envío:", await res.text());
        return;
      }

      const data = await res.json();

      // ✅ Actualizamos todos los estados sincronizados
      setShippingMethod(method);
      setShippingCost(data.shippingCost);
      setEstimatedDays(
        typeof data.estimatedDays === "string"
          ? parseInt(data.estimatedDays)
          : data.estimatedDays
      );

      // ✅ Actualizamos la orden de forma consistente
      const updatedOrder = {
        ...order,
        country,
        shipping: data.shippingCost,
        estimatedDays:
          typeof data.estimatedDays === "string"
            ? parseInt(data.estimatedDays)
            : data.estimatedDays,
        shippingMethod: method,
        shippingZone: data.zone,
        total:
          cart.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) +
          data.shippingCost,
      };

      setOrder(updatedOrder);
      localStorage.setItem("currentOrder", JSON.stringify(updatedOrder));
    } catch (err) {
      console.error("❌ Error actualizando envío:", err);
    }
  };


  const handleSuccess = async (paymentResult: any) => {
    try {
      setIsProcessing(true);

      const paymentPrep = JSON.parse(localStorage.getItem("payment-preparation") || "{}");
      const currentOrder = JSON.parse(localStorage.getItem("currentOrder") || "{}");
      const { customerEmail, shippingAddress, shippingOptionId } = paymentPrep;
      const { shipping, shippingMethod } = currentOrder; 

      console.log("💿 Datos cargados desde localStorage:", paymentPrep);

      // Crear carrito en Medusa
      const cartId = await createMedusaOrder();

      // Completar carrito
      const completeRes = await fetch("/api/medusa/complete-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          email: customerEmail,
          shipping_address: shippingAddress,
          payment_method: "manual",
          items: cart, // Usar cart de Firebase
        }),
      });

      const completed = await completeRes.json();
      console.log("✅ Carrito completado:", completed);

      // Calcular total usando datos de Firebase
      const total = cartTotals.total + shippingCost + iva;

      // Identificadores de pago
      function cleanObject(obj: any) {
        return Object.fromEntries(
          Object.entries(obj).filter(([_, v]) => v !== undefined)
        );
      }

      // 🔹 Detectar el paymentIntentId de Stripe
      let paymentIntentId;

      if (paymentMethod === "stripe") {
        paymentIntentId =
          paymentResult?.paymentIntent?.id ||
          paymentResult?.payment_intent ||
          paymentResult?.id ||
          paymentResult?.intent ||
          null;
      }

      const paypalCaptureId =
        paymentMethod === "paypal"
          ? paymentResult?.captureId || paymentResult?.orderID || null
          : null;

      if (paymentMethod === "stripe" && !paymentIntentId) {
        console.error("❌ No se obtuvo paymentIntentId de Stripe:", paymentResult);
        return;
      }

      // Guardar en Firebase
      try {
        console.log("🧾 Guardando orden en Firestore...");

        const orderData = {
          userId: user?.uid || "guest",
          email: customerEmail,
          items: cart,
          total,
          status: "paid",
          address: shippingAddress,
          medusaCartId: cartId,
          shippingMethod: shippingMethod.toLowerCase(),
          shippingCost: shipping || 0, 
          payment_method: paymentMethod,
          payment_intent_id: paymentIntentId,
          paypal_capture_id: paypalCaptureId,
          createdAt: new Date().toISOString(),
        };

        const cleanedOrder = cleanObject(orderData);
        await saveOrder(cleanedOrder);

        console.log("✅ Orden guardada correctamente en Firestore");

        // Limpiar carrito de Firebase después de la compra exitosa
        if (user?.uid) {
          await clearCartFromFirebase(user.uid);
        }

      } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        throw error;
      }

      console.log("🧹 Limpieza localStorage...");
      localStorage.removeItem("currentOrder");
      localStorage.removeItem("payment-preparation");
      localStorage.removeItem("checkout-progress");
      localStorage.removeItem("payment-progress");

      alert("✅ Orden procesada correctamente");
      router.push("/success");
    } catch (error: any) {
      console.error("❌ Error general en handleSuccess:", error);
      alert("Error al procesar el pedido: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };



  if (!order) return null;

  // Usar cálculos de Firebase en lugar del CartContext
  const taxRate = order.taxRate || 0.16;
  const productTax = cartTotals.subtotal * taxRate;
  const shippingTax = shippingCost * taxRate;
  const totalTax = productTax + shippingTax;
  const totalWithTax = cartTotals.subtotal + shippingCost + totalTax;

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-4xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 cursor-pointer inline-block">
              E-tianguis
            </h1>
          </Link>
        </div>

        {isProcessing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              <p className="text-yellow-800 font-medium">Procesando tu orden...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* 💳 Métodos de pago - Lado izquierdo */}
          <div className="xl:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-10">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-green-600 ml-2">Envío</div>
                </div>
                <div className="w-16 h-0.5 bg-green-500 mx-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div className="text-sm font-medium text-blue-600 ml-2">Pago</div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Método de pago
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Selecciona cómo quieres pagar tu pedido
              </p>

              {/* Métodos de pago */}
              <div className="space-y-4 mb-8">
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  paymentMethod === "stripe" 
                    ? "border-brown bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      disabled={isProcessing}
                      className="w-5 h-5 text-blue-600 focus:ring-brown"
                    />
                    <div className="w-10 h-6 bg-brown rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="font-medium">Tarjeta de crédito / débito</span>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  paymentMethod === "paypal" 
                    ? "border-brown bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      disabled={isProcessing}
                      className="w-5 h-5 text-blue-600 focus:ring-brown"
                    />
                    <div className="w-10 h-6 bg-blue-700 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Pay</span>
                    </div>
                    <span className="font-medium">PayPal</span>
                  </div>
                </label>
              </div>

              {/* Selector de envío */}
              <div className="bg-white rounded-xl p-1 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Método de envío
                </h3>
                <div className="space-y-3">
                  <select
                    data-testid="shippingMethod"
                    value={shippingMethod}
                    onChange={(e) => updateShipping(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                              focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown
                              transition-all duration-200 bg-white"
                    disabled={isProcessing}
                  >
                    <option value="">Selecciona un método de envío</option>
                    <option value="Estándar">Estándar</option>
                    <option value="Exprés">Exprés</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-2">
                    {shippingMethod
                      ? `📦 Llegará en ${estimatedDays} días aprox.`
                      : "Selecciona un método de envío para ver el tiempo estimado"}
                  </p>
                </div>
              </div>

              {/* 💳 Stripe integrado */}
              {paymentMethod === "stripe" && (
                <div className="mt-6">
                  <Elements stripe={stripePromise}>
                    <StripeCheckout
                      order={order}
                      totalWithTax={totalWithTax}
                      onSuccess={handleSuccess}
                    />
                  </Elements>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="mt-6">
                  <PayPalButton
                    amount={totalWithTax}
                    onSuccess={async (details: any) => {
                      try {
                        console.log("Detalles del pago PayPal:", details);
                        const captureId =
                          details.purchase_units?.[0]?.payments?.captures?.[0]?.id || details.id;

                        if (!captureId) {
                          console.error("No se encontró capture_id:", details);
                          alert("Error: No se pudo obtener el capture_id de PayPal.");
                          return;
                        }

                        await handleSuccess({
                          captureId,
                          orderID: details.id,
                          payer: details.payer,
                          status: details.status,
                        });
                      } catch (error) {
                        console.error("Error al obtener capture_id:", error);
                        alert("Hubo un error al procesar tu pago con PayPal.");
                      }
                    }}
                    onError={(err) => {
                      console.error("Error con PayPal:", err);
                      alert("Hubo un problema al procesar tu pago con PayPal.");
                    }}
                    disabled={isProcessing}
                  />
                </div>
              )}

              {paymentMethod === "transfer" && (
                <div className="mt-6">
                  <button
                    onClick={handleSuccess}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold 
                             py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all 
                             duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                             shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      "Confirmar Transferencia"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 💰 Resumen del pedido - Lado derecho */}
          <div className="xl:col-span-5">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header del resumen */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">Resumen del pedido</h2>
                  <p className="text-gray-300 text-sm">
                    {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>

                {/* Lista de productos */}
                <div className="p-6 max-h-80 overflow-y-auto">
                  <div className="space-y-4">
                    {cart.map((item: any) => (
                      <div key={item.variantId} className="flex gap-4 group">
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
                    <span>Envío ({shippingMethod || "No seleccionado"}):</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${(cartTotals.subtotal + shippingCost).toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>IVA productos ({(taxRate * 100).toFixed(0)}%):</span>
                      <span>${productTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>IVA envío ({(taxRate * 100).toFixed(0)}%):</span>
                      <span>${shippingTax.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-200">
                    <span>Total</span>
                    <span>${totalWithTax.toFixed(2)}</span>
                  </div>
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

function handleSuccess(arg0: { paymentIntent: PaymentIntent; }) {
  throw new Error("Function not implemented.");
}
function setHasSynced(arg0: boolean) {
  throw new Error("Function not implemented.");
}

