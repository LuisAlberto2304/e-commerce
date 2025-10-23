/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(savedOrders);
  }, []);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-semibold mb-2">Aún no tienes pedidos 📦</h1>
        <p className="text-gray-500 mb-6">
          Cuando realices una compra, podrás verla aquí.
        </p>
        <Link
          href="/"
          className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Historial de pedidos</h1>
      <p className="text-gray-600 mb-6">Revisa tus compras anteriores y su estado actual.</p>

      <div className="space-y-4">
        {orders.map((order, index) => {
          const date = new Date(order.createdAt).toLocaleDateString("es-MX");
          return (
            <div
              key={index}
              className="border rounded-xl p-5 shadow-sm hover:shadow-md transition bg-white"
            >
              <div className="flex flex-col sm:flex-row justify-between">
                <div>
                  <p className="font-semibold">Pedido #{order.id}</p>
                  <p className="text-sm text-gray-500">Fecha: {date}</p>
                  <p className="text-sm text-gray-500">Total: ${order.total?.toFixed(2)}</p>
                </div>

                <div className="mt-3 sm:mt-0 flex flex-col sm:items-end">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "Entregado"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Enviado"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status || "Procesando"}
                  </span>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>

              {/* Muestra un resumen de productos */}
              <div className="mt-4 border-t pt-3 text-sm text-gray-700">
                {order.items?.slice(0, 2).map((item: any, i: number) => (
                  <p key={i}>
                    {item.quantity}x {item.title || item.name}
                  </p>
                ))}
                {order.items?.length > 2 && (
                  <p className="text-gray-500 mt-1">+ {order.items.length - 2} más...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
