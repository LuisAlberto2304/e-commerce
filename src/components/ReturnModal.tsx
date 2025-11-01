/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function ReturnModal({ order, onClose }: { order: any; onClose: () => void }) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert("Selecciona al menos un producto para devolver");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          items: selectedItems.map((id) => ({ item_id: id, quantity: 1 })),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en devolución");

      setSuccess(true);
    } catch (error: any) {
      alert("Hubo un error al solicitar la devolución: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        {success ? (
          <div className="text-center space-y-3">
            <h2 className="text-lg font-semibold text-green-700">✅ Solicitud enviada</h2>
            <p className="text-gray-600">
              Tu solicitud de devolución fue enviada correctamente. El administrador la revisará pronto.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">Solicitar devolución</h2>
            <p className="text-gray-600 mb-4">
              Selecciona los productos que deseas devolver y escribe el motivo.
            </p>

            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 mb-4">
              {order.items.map((item: any) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleToggleItem(item.id)}
                  />
                  <span className="text-sm">{item.title}</span>
                </label>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo de devolución..."
              className="w-full border rounded-lg p-2 mb-4 text-sm focus:ring focus:ring-blue-200"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
