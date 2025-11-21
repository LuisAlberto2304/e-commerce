/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const foundOrder = savedOrders.find((o: any) => String(o.id) === String(id));
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [id]);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-semibold mb-2">Pedido no encontrado ❌</h1>
        <p className="text-gray-500 mb-6">No pudimos encontrar la información de este pedido.</p>
        <Link
          href="/orders"
          className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
        >
          Volver al historial
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("es-MX");
  const totalIVA = (order.tax ?? 0).toFixed(2);
  const subtotal = (order.subtotal ?? 0).toFixed(2);
  const shipping = (order.shipping ?? 0).toFixed(2);
  const total = (order.total ?? 0).toFixed(2);

  // 🧾 Función para generar el PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text("Factura de compra", 14, 20);
    doc.setFontSize(11);
    doc.text(`Pedido #${order.id}`, 14, 28);
    doc.text(`Fecha: ${orderDate}`, 14, 34);

    // Datos del cliente
    doc.setFontSize(12);
    doc.text("Datos del cliente:", 14, 46);
    doc.setFontSize(10);
    doc.text(`${order.fullName}`, 14, 52);
    doc.text(`${order.street}, ${order.city}, ${order.state}`, 14, 58);
    doc.text(`${order.country}, CP ${order.postalCode}`, 14, 64);
    doc.text(`Email: ${order.email} | Teléfono: ${order.phone}`, 14, 70);

    // Tabla de productos
    const tableData = order.items.map((item: any) => [
      item.title || item.name,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Producto", "Cantidad", "Precio", "Subtotal"]],
      body: tableData,
      theme: "striped",
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: $${subtotal}`, 140, finalY);
    doc.text(`IVA Total: $${totalIVA}`, 140, finalY + 6);
    doc.text(`Envío: $${shipping}`, 140, finalY + 12);
    doc.setFontSize(12);
    doc.text(`Total pagado: $${total}`, 140, finalY + 20);

    // Footer
    doc.setFontSize(9);
    doc.text(
      "Gracias por tu compra. Para soporte o dudas, contáctanos a soporte@etianguis.com",
      14,
      285
    );

    // Descargar archivo
    doc.save(`Factura_${order.id}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-8 mt-10">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Pedido #{order.id}</h1>
          <p className="text-gray-500 text-sm">Realizado el {orderDate}</p>
        </div>
        <span
          className={`mt-3 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${order.status === "Entregado"
              ? "bg-green-100 text-green-700"
              : order.status === "Enviado"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
        >
          {order.status || "Procesando"}
        </span>
      </div>

      {/* Productos */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-3">Productos comprados</h2>
        <ul className="divide-y divide-gray-200">
          {order.items?.map((item: any, i: number) => (
            <li key={i} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{item.title || item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <p className="font-semibold">${(item.quantity * item.price).toFixed(2)}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Totales */}
      <div className="border-t pt-4 mt-4 text-right space-y-1">
        <p className="text-gray-500">Subtotal: ${subtotal}</p>
        <p className="text-gray-500">IVA Total: ${totalIVA}</p>
        <p className="text-gray-500">Envío: ${shipping}</p>
        <hr className="my-2" />
        <p className="text-lg font-semibold">Total pagado: ${total}</p>
      </div>

      {/* Dirección de envío */}
      <div className="border-t mt-6 pt-4">
        <h2 className="text-lg font-semibold mb-2">Dirección de envío</h2>
        <p className="text-gray-700 leading-relaxed">
          {order.fullName} <br />
          {order.street}, {order.city}, {order.state} <br />
          {order.country}, CP {order.postalCode}
        </p>
      </div>

      {/* Contacto */}
      <div className="border-t mt-6 pt-4">
        <h2 className="text-lg font-semibold mb-2">Datos de contacto</h2>
        <p className="text-gray-700">
          📧 {order.email} <br /> 📞 {order.phone}
        </p>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition"
        >
          Descargar factura (PDF)
        </button>
        <Link
          href="/orders"
          className="border border-gray-400 px-5 py-2 rounded hover:bg-gray-100 transition"
        >
          Volver al historial
        </Link>
        <Link
          href="/"
          className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
