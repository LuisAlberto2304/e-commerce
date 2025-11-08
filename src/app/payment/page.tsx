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
  const updateShipping = async (method: string) => {
    if (!order?.country) return;

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: order.country,
          weight: cart.reduce(
            (acc: number, i: any) => acc + (i.weight || 0) * i.quantity,
            0
          ),
          method,
        }),
      });
      const data = await res.json();

      setShippingMethod(method);
      setShippingCost(data.shippingCost);
      setEstimatedDays(data.estimatedDays);

      setOrder((prev: any) => ({
        ...prev,
        shipping: data.shippingCost,
        total: cart.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) + data.shippingCost,
        shippingZone: data.zone,
        shippingMethod: method,
      }));

      localStorage.setItem(
        "currentOrder",
        JSON.stringify({
          ...order,
          shipping: data.shippingCost,
          estimatedDays: data.estimatedDays,
          shippingMethod: method,
          shippingZone: data.zone,
          total:
            cart.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) +
            data.shippingCost,
        })
      );

    } catch (err) {
      console.error("Error actualizando envío:", err);
    }
  };

  const handleSuccess = async (paymentResult: any) => {
    try {
      setIsProcessing(true);

      const paymentPrep = JSON.parse(localStorage.getItem("payment-preparation") || "{}");
      const { customerEmail, shippingAddress, shippingOptionId } = paymentPrep;

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
      window.location.href = "/success";
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
    <div className="max-w-4xl mx-auto p-6">

      {isProcessing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <p className="text-yellow-800">Procesando orden...</p>
          </div>
        </div>
      )}

      <div className="text-4xl font-bold text-center mb-10 hover:text-gray-600">
        <Link href="/">E-tianguis</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 💳 Métodos de pago */}
        <div className="bg-white p-8 shadow-lg rounded-xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Método de pago
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
                disabled={isProcessing}
              />
              <span>Tarjeta de crédito / débito</span>
            </label>

            <label className="flex items-center gap-3 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="paypal"
                checked={paymentMethod === "paypal"}
                onChange={() => setPaymentMethod("paypal")}
                disabled={isProcessing}
              />
              <span>PayPal</span>
            </label>

            <label className="flex items-center gap-3 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="transfer"
                checked={paymentMethod === "transfer"}
                onChange={() => setPaymentMethod("transfer")}
                disabled={isProcessing}
              />
              <span>Transferencia bancaria</span>
            </label>
          </div>

          {/* Selector de envío */}
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Método de envío</h3>
            <select
              data-testid="shippingMethod"
              value={shippingMethod}
              onChange={(e) => updateShipping(e.target.value)}
              className="w-full border rounded-lg p-2"
              disabled={isProcessing}
            >
              <option value="">Selecciona un método de envío</option>
              <option value="Estándar">Estándar</option>
              <option value="Exprés">Exprés</option>
            </select>

            <p className="text-sm text-gray-500 mt-1">
              {shippingMethod
                ? `Llegará en ${estimatedDays} días aprox.`
                : "Selecciona un método de envío para ver el tiempo estimado"}
            </p>
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

                  // 🧩 Extrae el capture_id directamente desde los detalles
                  const captureId =
                    details.purchase_units?.[0]?.payments?.captures?.[0]?.id || details.id;

                  if (!captureId) {
                    console.error("No se encontró capture_id:", details);
                    alert("Error: No se pudo obtener el capture_id de PayPal.");
                    return;
                  }

                  // 🔹 Envía los datos correctos a tu handleSuccess
                  await handleSuccess({
                    captureId,
                    orderID: details.id, // usa el id del pago como respaldo
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
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Procesando..." : "Confirmar Transferencia"}
              </button>
            </div>
          )}
        </div>

        {/* 💰 Resumen del pedido */}
        <div className="bg-white p-8 shadow-lg rounded-xl h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Resumen</h2>

          {cart.map((item: any) => (
            <div
              key={item.variantId}
              className="flex justify-between items-center text-gray-700 mb-2"
            >
              <div>
                <span className="font-medium">{item.title}</span>
                {item.variantDescription && (
                  <p className="text-sm text-gray-500">{item.variantDescription}</p>
                )}
              </div>
              <span>
                {item.quantity} × ${item.price.toFixed(2)}
              </span>
            </div>
          ))}

          {/* Costo de envío */}
          <p className="flex justify-between text-gray-800 mt-4">
            <span>Envío ({shippingMethod}):</span>
            <span>${shippingCost.toFixed(2)}</span>
          </p>

          {/* Subtotal (productos + envío) */}
          <p className="flex justify-between text-gray-800">
            <span>Subtotal:</span>
            <span>${(cartTotals.subtotal + shippingCost).toFixed(2)}</span>
          </p>

          <hr className="my-4" />

          {/* IVA separado */}
          <p className="flex justify-between text-gray-800">
            <span>IVA ({(taxRate * 100).toFixed(0)}%) productos:</span>
            <span>${productTax.toFixed(2)}</span>
          </p>

          <p className="flex justify-between text-gray-800">
            <span>IVA ({(taxRate * 100).toFixed(0)}%) envío:</span>
            <span>${shippingTax.toFixed(2)}</span>
          </p>

          <hr className="my-4" />

          {/* Total final */}
          <p className="flex justify-between font-bold text-lg text-gray-800 mt-2">
            <span>Total:</span>
            <span>${totalWithTax.toFixed(2)}</span>
          </p>
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

