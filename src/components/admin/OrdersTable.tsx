/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/OrdersTable.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import { Order } from '@/app/types/order';

interface OrdersTableProps {
  onOrderSelect: (order: Order) => void;
}

const OrdersTable = ({ onOrderSelect }: OrdersTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortField, setSortField] = useState<keyof Order>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Helper para filtros de fecha - MOVER ARRIBA de donde se usa
  const isWithinDateRange = (timestamp: any, range: string): boolean => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const timeDiff = today.getTime() - date.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    switch (range) {
      case 'today': return daysDiff < 1;
      case 'week': return daysDiff < 7;
      case 'month': return daysDiff < 30;
      default: return true;
    }
  };

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (): Promise<void> => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersData: Order[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtros combinados
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === 'all' || isWithinDateRange(order.createdAt, dateFilter);
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Ordenamiento
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'createdAt') {
      aValue = aValue instanceof Timestamp ? aValue.toMillis() : new Date(aValue).getTime();
      bValue = bValue instanceof Timestamp ? bValue.toMillis() : new Date(bValue).getTime();
    }
    
    if (sortField === 'total') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusConfig = (status: string) => {
    const config = {
      paid: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Pagado' },
      refunded: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Reembolsado' },
      cancelled: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Cancelado' },
      pending: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Pendiente' }
    };
    return config[status as keyof typeof config] || { color: 'bg-gray-50 text-gray-700 border-gray-200', label: status };
  };

  const formatDate = (timestamp: any): string => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString('es-ES');
  };

  // Estadísticas
  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    pending: orders.filter(o => o.status === 'pending').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
    totalRevenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0)
  };

  // Componente de tarjeta para móvil
  const OrderCard = ({ order }: { order: Order }) => {
    const statusConfig = getStatusConfig(order.status);
    
    return (
      <div 
        className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onOrderSelect(order)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-medium text-gray-900 font-mono text-sm">
              #{order.id?.substring(0, 8)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(order.createdAt)}
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-600">Cliente:</span>{' '}
            <span className="text-gray-900">
              {order.address?.first_name} {order.address?.last_name}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Email:</span>{' '}
            <span className="text-gray-900">{order.email}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Total:</span>{' '}
            <span className="font-semibold text-gray-900">${order.total}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
            Ver detalles
          </button>
        </div>
      </div>
    );
  };

  // Componente de header ordenable
  const SortableHeader = ({ field, children }: { field: keyof Order; children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDirection('desc');
        }
        setCurrentPage(1);
      }}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="text-gray-400">
          {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
        </span>
      </div>
    </th>
  );

  // Componente de paginación
  const Pagination = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-gray-100 gap-4">
      <div className="flex items-center gap-4">
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="5">5 por página</option>
          <option value="10">10 por página</option>
          <option value="25">25 por página</option>
          <option value="50">50 por página</option>
        </select>
        <span className="text-sm text-gray-600">
          Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedOrders.length)} de {sortedOrders.length}
        </span>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border text-sm ${
                currentPage === page 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              } rounded transition-colors`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Cargando órdenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Órdenes</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
          <div className="text-sm text-gray-600 mt-1">Pagadas</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-600 mt-1">Pendientes</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{stats.refunded}</div>
          <div className="text-sm text-gray-600 mt-1">Reembolsadas</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-sm text-gray-600 mt-1">Ingresos Totales</div>
        </div>
      </div>

      {/* Panel Principal */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Header con Filtros */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Órdenes</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Búsqueda */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar órdenes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm w-full sm:w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                >
                  <option value="all">Todo el tiempo</option>
                  <option value="today">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="paid">Pagadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="refunded">Reembolsadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {isMobile ? (
          // Vista móvil - Tarjetas
          <div className="p-4 space-y-4">
            {paginatedOrders.map((order: Order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          // Vista desktop - Tabla
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 backdrop-blur-sm">
                  <tr>
                    <SortableHeader field="id">
                      Orden ID
                    </SortableHeader>
                    <SortableHeader field="address">
                      Cliente
                    </SortableHeader>
                    <SortableHeader field="createdAt">
                      Fecha
                    </SortableHeader>
                    <SortableHeader field="total">
                      Total
                    </SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOrders.map((order: Order) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 font-mono">
                            #{order.id?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order?.address?.first_name} {order?.address?.last_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {order?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${order.total}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onOrderSelect(order)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors group-hover:underline"
                          >
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Paginación */}
        {sortedOrders.length > 0 && <Pagination />}

        {/* Estado vacío */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No se encontraron órdenes</p>
            <p className="text-gray-400 text-xs mt-1">Intenta cambiar los filtros o términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;