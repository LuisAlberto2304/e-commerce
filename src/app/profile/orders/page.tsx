/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import app from '@/app/lib/firebaseClient';
import { useAuth } from '@/context/userContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';

interface ReturnData {
  id: string;
  orderId: string;
  refund?: any;
  status?: string;
}


const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const [showOrderModal, setShowOrderModal] = useState(false);

  const handleOpenOrderModal = (order: any) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const db = getFirestore(app);

    useEffect(() => {
    const fetchOrdersAndReturns = async () => {
      if (!user) return;

      // 1️⃣ Traer órdenes del usuario
      const qOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
      const ordersSnap = await getDocs(qOrders);
      const ordersData = ordersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2️⃣ Definir tipo para returns
      interface ReturnData {
        createdAt: any;
        id: string;
        orderId: string;
        refund?: any;
        status?: string;
      }

      // 3️⃣ Traer devoluciones del usuario
      const qReturns = query(collection(db, "returns"), where("userId", "==", user.uid));
      const returnsSnap = await getDocs(qReturns);
      const returnsData: ReturnData[] = returnsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReturnData, "id">),
      }));

      // 4️⃣ Combinar información
      const mergedOrders = ordersData.map((order) => {
        const relatedReturn = returnsData.find((r) => r.orderId === order.id);

        if (relatedReturn) {
              return {
              ...order,
              refund: {
                ...relatedReturn,
                createdAt: relatedReturn.createdAt, // 👈 agrega esto
              },
              refundStatus: relatedReturn.status,
            };
        }

        return order;
      });

      setOrders(mergedOrders);
      setLoading(false);
    };

    fetchOrdersAndReturns();
  }, [user]);

  const handleOpenReturnModal = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
    setReturnReason('');
    setSuccess(false);
  };

  const handleSubmitReturn = async () => {
    if (!selectedOrder || !returnReason.trim()) return;
    try {
      setSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // pequeña animación simulada
      await addDoc(collection(db, 'returns'), {
        userId: user?.uid,
        orderId: selectedOrder.id,
        reason: returnReason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => setShowModal(false), 2000);
    } catch (error) {
      console.error('Error creando devolución:', error);
      setSubmitting(false);
      alert('❌ No se pudo enviar la solicitud.');
    }
  };

  const getStatusBadge = (status: string) => {
    const base =
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    const normalized = status?.toLowerCase();

    switch (normalized) {
      case "completed":
        return (
          <span className={`${base} bg-green-100 text-green-700`}>
            <CheckCircle size={14} /> Completada
          </span>
        );
      case "approved": // 👈 Devolución aprobada visualmente distinta
        return (
          <span className={`${base} bg-emerald-100 text-emerald-700`}>
            <CheckCircle size={14} /> Devolución aprobada
          </span>
        );
      case "pending":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-700`}>
            <Clock size={14} /> Pendiente
          </span>
        );
      case "cancelled":
        return (
          <span className={`${base} bg-red-100 text-red-700`}>
            <XCircle size={14} /> Cancelada
          </span>
        );
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-600`}>
            <Package size={14} /> Procesando
          </span>
        );
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Cargando tus órdenes...
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="text-center mt-20 text-gray-600">
        <Package className="mx-auto mb-2 w-10 h-10 text-gray-400" />
        <p>No tienes órdenes registradas todavía.</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis Órdenes</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow rounded-xl p-6"
          >
            {/* 🔹 Encabezado de orden */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
              <div>
                <p className="text-gray-800 font-medium">
                  <span className="text-gray-500 text-sm">Orden ID:</span> {order.id}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  <CreditCard size={14} className="inline mr-1" />
                  Total: <span className="font-semibold">${order.total?.toFixed(2)}</span>
                </p>
              </div>
              {getStatusBadge(order.refundStatus || order.status)}
            </div>

            {/* 🔹 Lista de productos */}
            <div className="border-t pt-3 mt-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Productos</h3>
              <div className="space-y-2">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm text-gray-700">
                    <span>{item.title}</span>
                    <span className="text-gray-500">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 🔹 Botones de acción */}
            <div className="flex flex-wrap gap-3 mt-5">
              {/* Botón Ver Detalles */}
              <button
                onClick={() => handleOpenOrderModal(order)}
                className="inline-flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Package size={16} />
                Ver detalles
              </button>

              {/* Botón Solicitar Devolución */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenReturnModal(order);
                }}
                disabled={["approved", "completed", "rejected"].includes(order.refundStatus?.toLowerCase())}
                className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors
                  ${
                    ["approved", "completed"].includes(order.refundStatus?.toLowerCase())
                      ? "bg-green-100 text-green-600 cursor-not-allowed"
                      : order.refundStatus?.toLowerCase() === "rejected"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
              >
                <RotateCcw size={16} />
                {["approved", "completed"].includes(order.refundStatus?.toLowerCase())
                  ? "Devolución aprobada"
                  : order.refundStatus?.toLowerCase() === "rejected"
                  ? "Devolución rechazada"
                  : "Solicitar devolución"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Detalles de la Orden</h2>
                <button
                  onClick={handleCloseOrderModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Contenido */}
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>ID de Orden:</strong> {selectedOrder.id}</p>
                <p><strong>Estado:</strong> {selectedOrder.status}</p>
                <p><strong>Método de pago:</strong> {selectedOrder.payment_method}</p>
                <p><strong>Total:</strong> ${selectedOrder.total?.toFixed(2)}</p>
                <p><strong>Envío:</strong> {selectedOrder.shippingMethod}</p>
                <p><strong>Fecha de creación:</strong> {new Date(selectedOrder.createdAt?.seconds * 1000).toLocaleString()}</p>

                {/* Dirección */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-1">Dirección de envío</h3>
                  <div className="text-gray-600">
                    <p>{selectedOrder.address?.first_name} {selectedOrder.address?.last_name}</p>
                    <p>{selectedOrder.address?.address_1}</p>
                    <p>{selectedOrder.address?.city}, {selectedOrder.address?.province}</p>
                    <p>{selectedOrder.address?.postal_code}, {selectedOrder.address?.country_code?.toUpperCase()}</p>
                    <p>Tel: {selectedOrder.address?.phone}</p>
                  </div>
                </div>

                {/* Productos */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-1">Productos</h3>
                  <div className="border rounded-lg divide-y">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between p-2">
                        <span>{item.title}</span>
                        <span>{item.quantity} ×</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reembolso */}
                {selectedOrder.refund && (
                  <div className="mt-4 border-t pt-3">
                    <h3 className="text-lg font-semibold mb-1 text-green-600">Reembolso</h3>
                    <p><strong>ID PayPal:</strong> {selectedOrder.refund.id}</p>
                    <p><strong>Proveedor:</strong> {selectedOrder.refund.provider}</p>
                    <p><strong>Estado:</strong> {selectedOrder.refund.status}</p>
                    <p><strong>Fecha:</strong> {new Date(selectedOrder.refund.createdAt || selectedOrder.refund.date).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {!success ? (
                <>
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">Solicitud de devolución</h2>
                  <p className="text-sm mb-3 text-gray-600">
                    Orden: <span className="font-mono">{selectedOrder?.id}</span>
                  </p>

                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Describe brevemente el motivo de la devolución..."
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                    rows={4}
                    disabled={submitting}
                  />

                  {/* Barra de progreso */}
                  {submitting && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                      <motion.div
                        className="h-2 bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5 }}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                      className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmitReturn}
                      disabled={submitting}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                      {submitting ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800">¡Solicitud enviada!</h3>
                  <p className="text-sm text-gray-600 mt-1">Tu devolución ha sido registrada correctamente.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersPage;
