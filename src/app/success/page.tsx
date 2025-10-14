/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuccessPage() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Recuperar la última orden guardada
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    if (orders.length > 0) {
      setOrder(orders[orders.length - 1]);
    }
  }, []);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <h1 className="text-3xl font-semibold mb-2">Sin pedidos recientes 🕓</h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          No encontramos ningún pedido reciente. Asegúrate de completar el proceso de pago correctamente.
        </p>
        <Link
          href="/"
          className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  // Formatear fecha de pedido
  const orderDate = new Date(order.createdAt).toLocaleDateString("es-MX");

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-xl p-8 mt-10 text-center">
      {/* Icono de éxito */}
      <div className="flex justify-center mb-4">
        <div className="bg-green-100 p-4 rounded-full">
          <span className="text-green-600 text-3xl">✅</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-green-600 mb-1">
        ¡Compra completada con éxito! 🎉
      </h1>

      <p className="text-gray-500 mb-4 text-sm">
        Pedido #{order.id} — {orderDate}
      </p>

      <p className="text-gray-600 mb-6">
        Gracias por tu compra, <span className="font-medium">{order.fullName}</span>.
      </p>

      {/* Resumen del pedido */}
      <div className="text-left border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-2">Resumen del pedido</h2>

        <ul className="divide-y divide-gray-200 mb-4">
          {order.items.map((item: any, i: number) => (
            <li key={i} className="py-2 flex justify-between items-center">
              <span>{item.title || item.name}</span>
              <span>
                {item.quantity} × ${item.price.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        {/* Mostrar IVA si existe */}
        {order.iva && (
          <p className="text-right text-gray-500">
            IVA: ${order.iva.toFixed(2)}
          </p>
        )}

        <p className="text-right text-gray-500">
          Envío: ${order.shipping.toFixed(2)}
        </p>

        <hr className="my-2" />

        <p className="text-right font-semibold text-lg">
          Total: ${order.total.toFixed(2)}
        </p>
      </div>


      {/* Dirección de envío */}
      <div className="border-t mt-6 pt-4 text-left">
        <h2 className="text-lg font-semibold mb-2">Dirección de envío</h2>
        <p className="text-gray-700">
          {order.street}, {order.city}, {order.country} <br />
          CP: {order.postalCode}
        </p>
        
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Link
          href="/"
          className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
        >
          Volver al inicio
        </Link>
        <Link
          href="/orders"
          className="border border-gray-400 px-5 py-2 rounded hover:bg-gray-100 transition"
        >
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}
