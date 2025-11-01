/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import app from '@/app/lib/firebaseClient';
import { useAuth } from '@/context/userContext';

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('');
  const { user } = useAuth();
  const db = getFirestore(app);

  // Cargar órdenes del usuario
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const handleOpenReturnModal = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedOrder || !returnReason.trim()) return;
    try {
      await addDoc(collection(db, 'returns'), {
        userId: user?.uid,
        orderId: selectedOrder.id,
        reason: returnReason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      alert('✅ Solicitud de devolución enviada');
      setShowModal(false);
      setReturnReason('');
    } catch (error) {
      console.error('Error creando devolución:', error);
      alert('❌ No se pudo enviar la solicitud.');
    }
  };

  if (loading) return <p>Cargando tus órdenes...</p>;
  if (orders.length === 0) return <p>No tienes órdenes registradas todavía.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mis Órdenes</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <p><strong>ID:</strong> {order.id}</p>
            <p><strong>Estado:</strong> {order.status}</p>
            <p><strong>Total:</strong> ${order.total?.toFixed(2)}</p>

            <div className="border-t pt-2 mt-2">
              <p className="font-semibold mb-2">Productos:</p>
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm text-gray-700">
                  <span>{item.title} — {item.quantity} unidad(es)</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleOpenReturnModal(order)}
              className="mt-3 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
            >
              Solicitar devolución
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-200 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-3">Solicitud de devolución</h2>
            <p className="text-sm mb-2 text-gray-600">Orden: {selectedOrder?.id}</p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Escribe el motivo de la devolución..."
              className="w-full border rounded-md p-2 mb-4 text-sm"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReturn}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
