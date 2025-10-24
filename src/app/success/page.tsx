/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuccessPage() {
  const [order, setOrder] = useState<any>(null);

  

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    if (orders.length > 0) {
      const lastOrder = orders[orders.length - 1];
      console.log("🧾 Orden cargada:", lastOrder);
      setOrder(lastOrder);
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

  
  const ivaRate = 0.16; // 16% de IVA
  const subtotal = order.subtotal || 0;
  const shipping = order.shipping || 0;

  // IVA de productos y envío
  const ivaProductos = order.tax ?? subtotal * ivaRate;
  const ivaEnvio = shipping * ivaRate;

  // IVA total combinado
  const ivaTotal = ivaProductos + ivaEnvio;

  // Total con IVA incluido
  const totalConIVA = subtotal + shipping + ivaTotal;
  const orderDate = new Date(order.createdAt).toLocaleDateString("es-MX");

  const direccion = {
    fullName: order.fullName || "No especificado",
    street: order.street || "Calle no registrada",
    city: order.city || "Ciudad no registrada",
    state: order.state || "",
    country: order.country || "País no registrado",
    postalCode: order.postalCode || "N/A",
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl mt-10 overflow-hidden border border-gray-200">
      {/* 🧩 Encabezado */}
      <div className="bg-green-600 text-white text-center py-8 px-6">
        <h1 className="text-2xl font-bold mb-1">¡Gracias por tu compra!</h1>
        <p className="text-sm opacity-90">Pedido #{order.id}</p>
        <p className="text-xs opacity-75">Fecha: {orderDate}</p>
      </div>

      {/* 🧾 Contenido principal */}
      <div className="p-8 space-y-6">
        {/* Datos del cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Datos del cliente</h2>
            <div className="text-gray-700 text-sm space-y-1">
              <p><strong>Nombre:</strong> {direccion.fullName}</p>
              <p><strong>Correo:</strong> {order.email}</p>
              <p><strong>Teléfono:</strong> {order.phone}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Dirección de envío</h2>
            <div className="text-gray-700 text-sm space-y-1">
              <p>{direccion.street}</p>
              <p>{direccion.city}, {direccion.state}</p>
              <p>{direccion.country}</p>
              <p>CP: {direccion.postalCode}</p>
            </div>
          </div>
        </div>

        {/* Tabla de productos */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Artículos del pedido</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 text-left">Producto</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any, i: number) => (
                  <tr
                    key={i}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">{item.title || item.name}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      ${item.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="border-t pt-4 text-right space-y-1 text-gray-700">
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA productos: ${ivaProductos.toFixed(2)}</p>
          <p>Envío: ${shipping.toFixed(2)}</p>
          <p>IVA envío: ${ivaEnvio.toFixed(2)}</p>
          <p className="font-medium">IVA total: ${ivaTotal.toFixed(2)}</p>  
          <hr className="my-2" />
          <p className="text-xl font-semibold text-gray-900">
            Total: ${totalConIVA.toFixed(2)}
          </p>
        </div>

        {/* Envío estimado */}
        {order.estimatedDays && (
          <div className="mt-4 text-sm text-gray-600">
            <p>
              ⏱️ <strong>Tiempo estimado de entrega:</strong>{" "}
              {order.estimatedDays} días hábiles.
            </p>
          </div>
        )}
      </div>

      {/* 🧭 Pie de página */}
      <div className="bg-gray-50 border-t px-6 py-6 text-center space-y-3">
        <p className="text-gray-600 text-sm">
          Recibirás un correo con la confirmación y los detalles de tu pedido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Volver al inicio
          </Link>
          <Link
            href="/orders"
            className="border border-gray-400 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
