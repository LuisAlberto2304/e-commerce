/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import app from '@/app/lib/firebaseClient';

const ReturnsAdminPage = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState<{ [key: string]: boolean }>({});
  const [refundResults, setRefundResults] = useState<{ [key: string]: string }>({});
  const db = getFirestore(app);

  // 🔹 Obtener todas las devoluciones
  useEffect(() => {
    const fetchReturns = async () => {
      const snapshot = await getDocs(collection(db, 'returns'));
      setReturns(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchReturns();
  }, []);

  // 🔹 Manejar aprobación/rechazo y reembolso
  const updateStatus = async (id: string, newStatus: string) => {
    const returnItem = returns.find(r => r.id === id);
    if (!returnItem) return;

    // Aprobar: hacemos el refund automáticamente
    if (newStatus === 'approved') {
      setLoadingRefunds(prev => ({ ...prev, [id]: true }));
      setRefundResults(prev => ({ ...prev, [id]: 'Procesando refund...' }));

      try {
        const res = await fetch('/api/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: returnItem.orderId }),
        });

        const data = await res.json();

        if (!data.success) {
          setRefundResults(prev => ({ ...prev, [id]: 'Error: ' + data.error }));
          return;
        }

        // Refund exitoso ✅
        setRefundResults(prev => ({ ...prev, [id]: 'Reembolso completado ✅' }));

        // Actualizar Firestore: estado + detalles del refund
        await updateDoc(doc(db, 'returns', id), {
          status: 'approved',
          refund: data.refund
        });

        // Actualizar estado local para re-render
        setReturns(prev =>
          prev.map(r => (r.id === id ? { ...r, status: 'approved', refund: data.refund } : r))
        );

      } catch (err) {
        console.error('Error refund:', err);
        setRefundResults(prev => ({ ...prev, [id]: 'Error conectando con el servidor ❌' }));
      } finally {
        setLoadingRefunds(prev => ({ ...prev, [id]: false }));
      }

    } else if (newStatus === 'rejected') {
      // Rechazo directo: no hay refund
      await updateDoc(doc(db, 'returns', id), { status: 'rejected' });
      setReturns(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'rejected' } : r))
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Solicitudes de Devolución</h1>

      {returns.length === 0 ? (
        <p>No hay devoluciones registradas.</p>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <div
              key={r.id}
              className="p-4 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
            >
              <div>
                <p><strong>Usuario:</strong> {r.userId}</p>
                <p><strong>Orden:</strong> {r.orderId}</p>
                <p><strong>Motivo:</strong> {r.reason}</p>
                <p><strong>Estado:</strong> 
                  <span className={`ml-2 font-medium ${r.status === 'approved' ? 'text-green-600' : r.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {r.status}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                {refundResults[r.id] && (
                  <p className="mt-1 text-sm">
                    <strong>Refund:</strong> {refundResults[r.id]}
                  </p>
                )}
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(r.id, 'approved')}
                    className={`px-3 py-1 text-white text-sm rounded-lg hover:bg-green-600 ${
                      loadingRefunds[r.id] ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500'
                    }`}
                    disabled={loadingRefunds[r.id]}
                  >
                    {loadingRefunds[r.id] ? 'Procesando...' : 'Aprobar'}
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'rejected')}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnsAdminPage;
