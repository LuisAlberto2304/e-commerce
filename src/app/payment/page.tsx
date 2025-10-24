"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import PayPalButton from "@/components/PayPalButton";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

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
    setIsProcessing(true);
    setError(null);

    try {
      // Crear PaymentIntent desde el backend
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(totalWithTax * 100), // en centavos
          currency: "mxn",
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Confirmar pago (se abrirá modal 3D Secure si es necesario)
      const result = await stripe!.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements!.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || "Error al procesar el pago");

        localStorage.setItem(
          "paymentError",
          JSON.stringify({
            step: "Pago con Stripe",
            message: result.error.message || "Error al procesar el pago",
          })
        );

        router.push("/failure");
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      localStorage.setItem(
        "paymentError",
        JSON.stringify({
          step: "Conexión o servidor",
          message: err.message,
        })
      );
      router.push("/failure");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripePayment}>
      <CardElement className="border p-3 rounded-md mb-4" />
      <button
        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={isProcessing}
        onClick={() => {}}
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
  
  // Usar el CartContext para sincronización
  const { cart, subtotal, tax, total, shipping, syncWithMedusa, isSyncing, clearCart } = useCart();
  const [hasSynced, setHasSynced] = useState(false);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(null);

  // ✅ Sincronizar carrito local con Medusa al cargar
  useEffect(() => {
    const syncCart = async () => {
      if (!hasSynced && cart.length > 0) {
        try {
          console.log('🔄 Iniciando sincronización con Medusa...');
          const result = await syncWithMedusa();
          
          if (result.success) {
            console.log('✅ Sincronización completada con cartId:', result.cartId);
          } else {
            console.warn('⚠️ Sincronización falló:', result.error);
            // Puedes mostrar un toast o mensaje al usuario si quieres
            // Pero no interrumpas el flujo
          }
          
          setHasSynced(true);
        } catch (error) {
          console.error('❌ Error inesperado en sincronización:', error);
          setHasSynced(true); // Siempre marca como sincronizado para continuar
        }
      } else {
        setHasSynced(true); // Si no hay items o ya está sincronizado
      }
    };

    syncCart();
  }, [cart, syncWithMedusa, hasSynced]);

  // ✅ Crear carrito en Medusa y preparar la orden
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

      setMedusaCartId(cartId);

      // 2. Agregar productos al carrito de Medusa
      const cartItemsRes = await fetch("/api/medusa/cart-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          items: cart.map(item => ({
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const cartItemsData = await cartItemsRes.json();
      if (!cartItemsData.success) {
        throw new Error("No se pudieron agregar los productos al carrito de Medusa");
      }

      console.log('✅ Productos agregados al carrito de Medusa');

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
      medusaCartId,
    };

    localStorage.setItem("payment-progress", JSON.stringify(paymentProgress));
  }, [order, paymentMethod, shippingMethod, shippingCost, estimatedDays, iva, medusaCartId]);

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
        setMedusaCartId(data.medusaCartId || null);

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

  // Calcular envío cuando cambie método
  const updateShipping = async (method: string) => {
    if (!order?.country) return;

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: order.country,
          weight: order.items.reduce(
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
        total: prev.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) + data.shippingCost,
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
            order.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) +
            data.shippingCost,
        })
      );

    } catch (err) {
      console.error("Error actualizando envío:", err);
    }
  };

const handleSuccess = async () => {
  try {
    setIsProcessing(true);

    // 🧠 Recuperar info guardada del checkout
    const paymentPrep = JSON.parse(localStorage.getItem("payment-preparation") || "{}");
    const { customerEmail, shippingAddress, shippingOptionId, items } = paymentPrep;

    console.log("💿 Datos cargados desde localStorage:", paymentPrep);

    // 🛒 1. Crear carrito
    const createCartRes = await fetch("/api/medusa/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region_id: process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION,
      }),
    });
    const cartData = await createCartRes.json();
    const cartId = cartData.cart?.id;
    if (!cartId) throw new Error("No se pudo crear el carrito");

    console.log("🛒 Carrito creado:", cartId);

    // 👤 2. Asociar cliente + dirección
    await fetch(`/api/medusa/cart/${cartId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customerEmail,
        shipping_address: shippingAddress,
      }),
    });

    console.log("📦 Dirección asociada al carrito");

    // 🧱 3. Agregar productos
    await fetch("/api/medusa/cart-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId,
        items,
      }),
    });

    console.log("🧱 Productos agregados");

    // 🚚 4. Agregar método de envío
    await fetch(`/api/medusa/cart/${cartId}/shipping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        option_id: shippingOptionId,
      }),
    });

    console.log("🚚 Método de envío agregado");

    // 💰 5. Crear colección de pago
    const payColRes = await fetch("/api/medusa/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart_id: cartId,
      }),
    });

    const payCol = await payColRes.json();
    console.log("💳 Colección de pago creada:", payCol);

    // ✅ 6. Completar carrito
    const completeRes = await fetch("/api/medusa/complete-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId,
        email: customerEmail,
        shipping_address: shippingAddress,
        payment_method: "manual",
        items,
      }),
    });

    const completed = await completeRes.json();
    console.log("✅ Carrito completado:", completed);

    // 🧹 Limpieza y redirección
    localStorage.removeItem("currentOrder");
    localStorage.removeItem("payment-preparation");
    localStorage.removeItem("checkout-progress");

    window.location.href = "/success";
  } catch (error) {
    console.error("❌ Error en el flujo Medusa:", error);
    alert("Error al procesar el pedido");
  } finally {
    setIsProcessing(false);
  }
};
  
  if (!order) return null;

  // Usar cálculos del CartContext en lugar de recalcular
  const taxRate = order.taxRate || 0.16;
  const productTax = subtotal * taxRate;
  const shippingTax = shippingCost * taxRate;
  const totalTax = productTax + shippingTax;
  const totalWithTax = subtotal + shippingCost + totalTax;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Estado de sincronización */}
      {isSyncing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-800">Sincronizando carrito con el inventario...</p>
          </div>
        </div>
      )}

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
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                disabled={isSyncing || isProcessing}
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
                disabled={isSyncing || isProcessing}
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
                disabled={isSyncing || isProcessing}
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
              disabled={isSyncing || isProcessing}
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
          {paymentMethod === "card" && (
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
                onSuccess={(details) => {
                  console.log("✅ Pago exitoso con PayPal:", details);
                  handleSuccess();
                }}
                onError={(err) => {
                  console.error("Error con PayPal:", err);
                  alert("Hubo un problema al procesar tu pago con PayPal.");
                }}
                disabled={isSyncing || isProcessing}
              />
            </div>
          )}

          {paymentMethod === "transfer" && (
            <div className="mt-6">
              <button
                onClick={handleSuccess}
                disabled={isSyncing || isProcessing}
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
            <span>${(subtotal + shippingCost).toFixed(2)}</span>
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