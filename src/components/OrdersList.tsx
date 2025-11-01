/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ReturnModal from "./ReturnModal";

export default function OrdersList({ userEmail }: { userEmail: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!userEmail) return;

    async function fetchOrders() {
      setLoading(true);
      const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    }

    fetchOrders();
  }, [userEmail]);

  if (loading) return <p>Cargando órdenes...</p>;
  if (orders.length === 0) return <p className="text-gray-500">No tienes órdenes aún.</p>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border p-4 rounded-lg shadow-sm">
          <p><strong>ID:</strong> {order.id}</p>
          <p><strong>Total:</strong> ${order.total / 100}</p>
          <p><strong>Estado:</strong> {order.status}</p>

          <button
            onClick={() => setSelectedOrder(order)}
            className="mt-2 text-blue-600 hover:underline text-sm font-medium"
          >
            Solicitar devolución
          </button>
        </div>
      ))}

      {selectedOrder && (
        <ReturnModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
