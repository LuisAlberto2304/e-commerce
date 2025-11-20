/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import { Order } from '@/app/types/order';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  averageOrderValue: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product';
  title: string;
  description: string;
  timestamp: any;
  status?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));

      // Filter orders by time range
      const filteredOrders = filterOrdersByTimeRange(allOrders, timeRange);
      
      // Calculate stats
      const totalRevenue = filteredOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
      const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

      // Calculate monthly growth (simplified)
      const previousMonthOrders = filterOrdersByTimeRange(allOrders, 'month', true);
      const previousMonthRevenue = previousMonthOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      const monthlyGrowth = previousMonthRevenue > 0 
        ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      setStats({
        totalOrders: filteredOrders.length,
        totalRevenue,
        pendingOrders,
        averageOrderValue,
        monthlyGrowth
      });

      // Set recent orders (last 5)
      setRecentOrders(filteredOrders.slice(0, 5));

      // Generate recent activity
      generateRecentActivity(filteredOrders);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByTimeRange = (orders: Order[], range: string, previous: boolean = false): Order[] => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - (previous ? 1 : 0), 1);
        break;
      default:
        return orders;
    }

    if (previous) {
      const endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      return orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    return orders.filter(order => {
      const orderDate = order.createdAt instanceof Timestamp 
        ? order.createdAt.toDate() 
        : new Date(order.createdAt);
      return orderDate >= startDate;
    });
  };

  const generateRecentActivity = (orders: Order[]) => {
    const activity: RecentActivity[] = orders.slice(0, 8).map(order => ({
      id: order.id || `order-${Date.now()}-${Math.random()}`, // Usar ID de orden o generar uno único
      type: 'order' as const,
      title: `Nueva orden #${(order.id || '').substring(0, 8)}`,
      description: `${order.address?.first_name || 'Cliente'} ${order.address?.last_name || ''} - $${order.total || 0}`,
      timestamp: order.createdAt,
      status: order.status
    }));

    // Add some mock activities for demonstration
    const mockActivities: RecentActivity[] = [
      {
        id: 'user-1',
        type: 'user',
        title: 'Nuevo usuario registrado',
        description: 'maria.garcia@email.com se unió a la tienda',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'product-1',
        type: 'product',
        title: 'Producto actualizado',
        description: 'Zapatos Deportivos Premium - Inventario actualizado',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 'order-system-1',
        type: 'order',
        title: 'Procesamiento automático',
        description: 'Sistema: 3 órdenes procesadas exitosamente',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    const allActivities = [...activity, ...mockActivities];
    
    setRecentActivity(allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 8)); // Limitar a 8 actividades
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Resumen general de tu tienda</p>
          </div>
          
          <div className="flex items-center  gap-4 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="all">Todo el tiempo</option>
            </select>
            
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Período actual</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <div className="flex items-center mt-1">
                <span className={`text-xs ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.monthlyGrowth >= 0 ? '↗' : '↘'} {Math.abs(stats.monthlyGrowth).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs mes anterior</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Órdenes Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.averageOrderValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Por orden</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h2>
              <Link 
                href="/admin/orders"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Ver todas
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      order.status === 'paid' ? 'bg-green-500' :
                      order.status === 'pending' ? 'bg-amber-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        #{(order.id || '').substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.address?.first_name} {order.address?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total || 0}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-center text-gray-500 py-4">No hay órdenes recientes</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'order' ? 'bg-blue-100' :
                    activity.type === 'user' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    <span className={`text-sm ${
                      activity.type === 'order' ? 'text-blue-600' :
                      activity.type === 'user' ? 'text-green-600' :
                      'text-purple-600'
                    }`}>
                      {activity.type === 'order' ? '📦' : activity.type === 'user' ? '👤' : '📊'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-500 py-4">No hay actividad reciente</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/orders"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Gestionar Órdenes</h3>
          <p className="text-sm text-gray-600 mt-1">Ver todas las órdenes</p>
        </Link>

        <Link
          href="/admin/products"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Productos</h3>
          <p className="text-sm text-gray-600 mt-1">Gestionar inventario</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Clientes</h3>
          <p className="text-sm text-gray-600 mt-1">Ver base de clientes</p>
        </Link>

        <Link
          href="/dashboard"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Analíticas</h3>
          <p className="text-sm text-gray-600 mt-1">Ver reportes</p>
        </Link>
      </div>
    </div>
  );
}