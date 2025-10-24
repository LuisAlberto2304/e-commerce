/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    paypal: any;
  }
}

export default function PayPalButton({
  amount,
  onSuccess,
  onError,
  disabled,
}: {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (err: any) => void;
  disabled?: boolean
}) {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.paypal || !paypalRef.current) return;

    // Limpia el contenedor por si hay un render previo
    paypalRef.current.innerHTML = "";

    console.log("🟡 Renderizando botón PayPal con monto:", amount);

    window.paypal
      .Buttons({
        createOrder: (_: any, actions: any) =>
          actions.order.create({
            purchase_units: [{ amount: { value: amount.toFixed(2) } }],
          }),
        onApprove: async (_: any, actions: any) => {
          const details = await actions.order.capture();
          console.log("✅ Pago aprobado:", details);
          onSuccess(details);
        },
        onError: (err: any) => {
          console.error("❌ Error PayPal:", err);
          onError(err);
        },
      })
      .render(paypalRef.current);
  }, [amount]);

  return (
    <div className="flex justify-center mt-4">
      <div ref={paypalRef} id="paypal-button-container" className="w-full max-w-lg"/>
    </div>
  );
}
