/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import app from '@/app/lib/firebaseClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { structuredDataReturns } from "./adminReturns.metadata";

interface ReturnItem {
  id: string;
  userId: string;
  orderId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date | string;
  refund?: any;
  userEmail?: string;
  amount?: number;
  currency?: string;
  // Agregar más propiedades opcionales que puedan venir de Firebase
  [key: string]: any; // Para manejar propiedades dinámicas de Firebase
}

interface RefundState {
  [key: string]: {
    loading: boolean;
    message: string;
    error?: boolean;
  };
}

// 🔹 Función auxiliar para formatear fecha
const formatFirebaseDate = (date: Timestamp | Date | string): string => {
  if (!date) return 'Fecha no disponible';
  
  try {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleString();
    } else if (date instanceof Date) {
      return date.toLocaleString();
    } else if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    } else {
      return 'Formato de fecha inválido';
    }
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
};

// 🔹 Tipo para filtros y ordenamiento
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';
type SortField = 'createdAt' | 'orderId' | 'userEmail' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

const ReturnsAdminPage = () => {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundStates, setRefundStates] = useState<RefundState>({});
  
  // 🔹 Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  const db = getFirestore(app);
  const { isAdmin, loading: authLoading } = useAdminAuth();

  // 🔹 Obtener todas las devoluciones
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const returnsQuery = query(
          collection(db, 'returns'), 
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(returnsQuery);
        const returnsData = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId || '',
            orderId: data.orderId || '',
            reason: data.reason || '',
            status: data.status || 'pending',
            createdAt: data.createdAt || new Date(),
            refund: data.refund,
            userEmail: data.userEmail,
            amount: data.amount, // Puede ser undefined
            currency: data.currency, // Puede ser undefined
            ...data // Incluir todas las demás propiedades
          } as ReturnItem;
        });
        setReturns(returnsData);
        setFilteredReturns(returnsData);
      } catch (error) {
        console.error('Error fetching returns:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && isAdmin) {
      fetchReturns();
    }
  }, [authLoading, isAdmin, db]);

  // 🔹 Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...returns];

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.orderId?.toLowerCase().includes(term) ||
        item.userEmail?.toLowerCase().includes(term) ||
        item.userId?.toLowerCase().includes(term) ||
        item.reason?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Filtro por rango de fechas
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter(item => {
        const itemDate = getDateFromFirebase(item.createdAt);
        return itemDate >= startDate;
      });
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Incluir todo el día
      result = result.filter(item => {
        const itemDate = getDateFromFirebase(item.createdAt);
        return itemDate <= endDate;
      });
    }

    // Ordenamiento
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Convertir fechas para comparación
      if (sortField === 'createdAt') {
        aValue = getDateFromFirebase(aValue).getTime();
        bValue = getDateFromFirebase(bValue).getTime();
      }

      // Manejar valores undefined/null para campos opcionales como amount
      if (aValue == null) aValue = sortField === 'amount' ? 0 : '';
      if (bValue == null) bValue = sortField === 'amount' ? 0 : '';

      // Comparar
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredReturns(result);
  }, [returns, searchTerm, statusFilter, sortField, sortDirection, dateRange]);

  // 🔹 Función auxiliar para obtener fecha desde Firebase
  const getDateFromFirebase = (date: Timestamp | Date | string): Date => {
    if (date instanceof Timestamp) {
      return date.toDate();
    } else if (date instanceof Date) {
      return date;
    } else if (typeof date === 'string') {
      return new Date(date);
    }
    return new Date();
  };

  // 🔹 Manejar cambio de ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 🔹 Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setSortField('createdAt');
    setSortDirection('desc');
  };

  // 🔹 Manejar aprobación/rechazo y reembolso
  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const returnItem = returns.find(r => r.id === id);
    if (!returnItem) return;

    // Actualizar estado local inmediatamente para mejor UX
    setReturns(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );

    if (newStatus === 'approved') {
      setRefundStates(prev => ({ 
        ...prev, 
        [id]: { loading: true, message: 'Procesando reembolso...' } 
      }));

      try {
        const res = await fetch('/api/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId: returnItem.orderId,
            amount: returnItem.amount, // Puede ser undefined
            currency: returnItem.currency // Puede ser undefined
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setRefundStates(prev => ({ 
            ...prev, 
            [id]: { 
              loading: false, 
              message: `Error: ${data.error}`,
              error: true 
            } 
          }));
          
          // Revertir estado si falla
          setReturns(prev =>
            prev.map(r => r.id === id ? { ...r, status: 'pending' } : r)
          );
          return;
        }

        // Refund exitoso ✅
        setRefundStates(prev => ({ 
          ...prev, 
          [id]: { 
            loading: false, 
            message: 'Reembolso completado ✅' 
          } 
        }));

        // Actualizar Firestore
        await updateDoc(doc(db, 'returns', id), {
          status: 'approved',
          refund: data.refund,
          processedAt: new Date()
        });

      } catch (err: any) {
        console.error('Error processing refund:', err);
        setRefundStates(prev => ({ 
          ...prev, 
          [id]: { 
            loading: false, 
            message: 'Error conectando con el servidor ❌',
            error: true 
          } 
        }));
        
        // Revertir estado
        setReturns(prev =>
          prev.map(r => r.id === id ? { ...r, status: 'pending' } : r)
        );
      }

    } else if (newStatus === 'rejected') {
      try {
        await updateDoc(doc(db, 'returns', id), { 
          status: 'rejected',
          processedAt: new Date()
        });
      } catch (error) {
        console.error('Error rejecting return:', error);
        setReturns(prev =>
          prev.map(r => r.id === id ? { ...r, status: 'pending' } : r)
        );
      }
    }
  };

  // 🔹 Estadísticas para mostrar
  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Verificando permisos...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          No tienes permisos de administrador para acceder a esta página.
        </div>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataReturns) }}
      />
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header con estadísticas */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Solicitudes de Devolución</h1>
          <div className="text-sm text-gray-600">
            {stats.pending} pendientes • {stats.total} total
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pendientes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-green-700">Aprobados</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-red-700">Rechazados</div>
          </div>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Orden, usuario, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>

            {/* Filtro por fecha inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por fecha fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Ordenamiento y acciones */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-700">Ordenar por:</span>
              {(['createdAt', 'orderId', 'userEmail', 'status'] as SortField[]).map(field => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    sortField === field
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {{
                    createdAt: 'Fecha',
                    orderId: 'Orden',
                    userEmail: 'Usuario',
                    status: 'Estado',
                    amount: 'Monto'
                  }[field]} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
              <div className="text-sm text-gray-500">
                {filteredReturns.length} resultados
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-48">
            <div className="text-lg">Cargando solicitudes...</div>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {returns.length === 0 
                ? 'No hay devoluciones registradas.' 
                : 'No se encontraron resultados con los filtros aplicados.'}
            </p>
            {returns.length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReturns.map((r) => (
              <ReturnCard 
                key={r.id} 
                returnItem={r} 
                refundState={refundStates[r.id]}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// 🔹 Componente de Tarjeta Separado - CORREGIDO para manejar amount opcional
const ReturnCard = ({ 
  returnItem, 
  refundState, 
  onUpdateStatus 
}: { 
  returnItem: ReturnItem;
  refundState?: { loading: boolean; message: string; error?: boolean };
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  return (
    <div className={`p-4 border rounded-lg bg-white shadow-sm ${
      returnItem.status !== 'pending' ? 'opacity-75' : ''
    }`}>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap gap-4 mb-2">
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(returnItem.status)}`}>
              {getStatusText(returnItem.status)}
            </span>
            {/* Mostrar amount solo si existe */}
            {returnItem.amount && (
              <span className="text-sm text-gray-600">
                Monto: {returnItem.amount} {returnItem.currency || ''}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><strong>Usuario:</strong> {returnItem.userEmail || returnItem.userId || 'N/A'}</p>
            <p><strong>Orden:</strong> {returnItem.orderId || 'N/A'}</p>
            <p><strong>Motivo:</strong> {returnItem.reason || 'N/A'}</p>
            <p><strong>Solicitado:</strong> {formatFirebaseDate(returnItem.createdAt)}</p>
          </div>

          {refundState && (
            <p className={`mt-2 text-sm ${
              refundState.error ? 'text-red-600' : 'text-green-600'
            }`}>
              {refundState.message}
            </p>
          )}
        </div>

        {returnItem.status === 'pending' && (
          <div className="flex flex-col gap-2 min-w-[120px]">
            <button
              onClick={() => onUpdateStatus(returnItem.id, 'approved')}
              disabled={refundState?.loading}
              className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                refundState?.loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {refundState?.loading ? 'Procesando...' : 'Aprobar'}
            </button>
            <button
              onClick={() => onUpdateStatus(returnItem.id, 'rejected')}
              disabled={refundState?.loading}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Rechazar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsAdminPage;