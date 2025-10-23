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

  // ✅ Guardar progreso del pago automáticamente
  useEffect(() => {
    if (!order) return; // No guardes si aún no hay orden cargada

    const paymentProgress = {
      step: "payment",
      order,
      paymentMethod,
      shippingMethod,
      shippingCost,
      estimatedDays,
      iva,
    };

    localStorage.setItem("payment-progress", JSON.stringify(paymentProgress));
  }, [order, paymentMethod, shippingMethod, shippingCost, estimatedDays, iva]);

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
          method, // <-- enviar método seleccionado
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

      // Opcional: guardar en localStorage
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
      // Crear carrito en Medusa vía proxy
      const cartRes = await fetch("/api/medusa/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        
      });
      
      const medusaCart = await cartRes.json();
      const cartId = medusaCart?.cart?.id;

      if (!cartId) throw new Error("No se pudo crear el carrito en Medusa");


      // Agregar productos al carrito vía proxy
      const cartItemsRes = await fetch("/api/medusa/cart-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          items: order.items.map((item: any) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      });

      const cartItemsData = await cartItemsRes.json();
      if (!cartItemsData.success) throw new Error("No se pudieron agregar los productos al carrito");

      const completeRes = await fetch("/api/medusa/complete-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: medusaCart.cart.id }), // asegúrate de usar el campo correcto
        });

        const completed = await completeRes.json();

        if (!completeRes.ok || !completed.order?.id) {
          console.error("❌ Error completando la orden:", completed);
          throw new Error("No se pudo completar la orden en Medusa");
        }

        console.log("✅ Orden creada en Medusa:", completed.order);

      // 4️⃣ Actualizar inventario vía proxy
      const updateInventoryRes = await fetch("/api/medusa/update-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.items.map((item: any) => ({
            variantId: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      });
      const inventoryData = await updateInventoryRes.json();
      console.log("📦 Inventario actualizado correctamente", inventoryData);

      // 5️⃣ Guardar orden localmente
      const finalOrder = {
        id: Date.now(),
        ...order,
        medusaOrderId: completed.order.id,
        shipping: shippingCost,
        shippingMethod,
        createdAt: new Date().toISOString(),
      };

      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      existingOrders.push(finalOrder);
      localStorage.setItem("orders", JSON.stringify(existingOrders));

      localStorage.removeItem("cart");
      localStorage.removeItem("currentOrder");

      // 6️⃣ Redirigir al success
      alert("Orden completada y stock actualizado correctamente");
      localStorage.removeItem("payment-progress");
      window.location.href = "/success";
    } catch (error: unknown) {
        console.error("❌ Error al procesar la orden:", error);

        let message = "Ocurrió un problema al completar la orden";
        if (error instanceof Error) {
          message = error.message;
        }

        localStorage.setItem(
          "paymentError",
          JSON.stringify({
            step: "Procesamiento de orden en Medusa",
            message,
          })
        );

        window.location.href = "/failure";
      }
  };


  if (!order) return null;

  const subtotal = order.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const total = subtotal + shippingCost;

  // Obtener el porcentaje de IVA desde el pedido
  const taxRate = order.taxRate || 0.16; // usa 16% por defecto si no existe

  // Calcular IVA separado para productos y envío
  const productTax = subtotal * taxRate;
  const shippingTax = shippingCost * taxRate;
  const totalTax = productTax + shippingTax;

  // Total con IVA y envío
  const totalWithTax = subtotal + shippingCost + totalTax;

  return (
    <div className="max-w-4xl mx-auto p-6">
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
              >
                {/* Opción por defecto */}
                <option value="">Selecciona un método de envío</option>

                {/* Opciones disponibles */}
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
              />
            </div>
          )}
        </div>

        {/* 💰 Resumen del pedido */}
        <div className="bg-white p-8 shadow-lg rounded-xl h-fit">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Resumen</h2>

        {order.items.map((item: any) => (
          <div
            key={item.id}
            className="flex justify-between items-center text-gray-700"
          >
            <span>{item.title}</span>
            <span>
              {item.quantity} × ${item.price.toFixed(2)}
            </span>
          </div>
        ))}

        {/* Costo de envío */}
        <p className="flex justify-between text-gray-800">
          <span>Envío ({shippingMethod} - {order.shippingZone}):</span>
          <span>${shippingCost.toFixed(2)}</span>
        </p>

        

        
        
        {/* Subtotal (productos + envío) */}
        <p className="flex justify-between text-gray-800">
          <span>Subtotal:</span>
          <span>${total.toFixed(2)}</span>
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
