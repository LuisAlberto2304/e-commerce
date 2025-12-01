/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/userContext";
import { db } from "@/app/lib/firebaseClient";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp
} from "firebase/firestore";

interface ProductSale {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
  averagePrice: number;
  ordersCount: number;
  image?: string;
}

interface DailySales {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProductsSold: number;
  averageOrderValue: number;
  bestSellingProducts: ProductSale[];
  dailySales: DailySales[];
  salesByStatus: {
    paid: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("📊 Cargando analytics para vendedor:", user.uid);

        // Obtener todas las órdenes del vendedor
        const ordersRef = collection(db, "sellers", user.uid, "orders");
        const q = query(ordersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const allOrders: any[] = [];
        querySnapshot.forEach((doc) => {
          allOrders.push({
            id: doc.id,
            ...doc.data()
          });
        });

        console.log("✅ Órdenes cargadas para analytics:", allOrders.length);

        // Filtrar por fecha si es necesario
        const filteredOrders = filterOrdersByDateRange(allOrders, dateRange);
        
        // Procesar datos para analytics
        const analyticsData = processAnalyticsData(filteredOrders);
        setAnalytics(analyticsData);

      } catch (error) {
        console.error("❌ Error cargando analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, dateRange]);

  const filterOrdersByDateRange = (orders: any[], range: string) => {
    if (range === "all") return orders;

    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        return orders;
    }

    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate;
    });
  };

  const processAnalyticsData = (orders: any[]): AnalyticsData => {
    // Calcular métricas básicas
    const totalRevenue = orders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);
    const totalOrders = orders.length;
    const totalProductsSold = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0), 0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Productos más vendidos
    const productSales: { [key: string]: ProductSale } = {};

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName || item.title,
            totalSales: 0,
            totalRevenue: 0,
            totalQuantity: 0,
            averagePrice: 0,
            ordersCount: 0,
            image: item.image
          };
        }

        productSales[item.productId].totalQuantity += item.quantity || 0;
        productSales[item.productId].totalRevenue += (item.price || 0) * (item.quantity || 0);
        productSales[item.productId].ordersCount += 1;
      });
    });

    // Calcular promedio de precios y ordenar
    Object.values(productSales).forEach(product => {
      product.totalSales = product.totalQuantity;
      product.averagePrice = product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0;
    });

    const bestSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Ventas diarias
    const dailySalesMap: { [key: string]: DailySales } = {};

    orders.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailySalesMap[dateKey]) {
        dailySalesMap[dateKey] = {
          date: dateKey,
          sales: 0,
          orders: 0,
          revenue: 0
        };
      }

      dailySalesMap[dateKey].sales += order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      dailySalesMap[dateKey].orders += 1;
      dailySalesMap[dateKey].revenue += order.orderTotal || 0;
    });

    const dailySales = Object.values(dailySalesMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Últimos 30 días

    // Ventas por estado
    const salesByStatus = {
      paid: orders.filter(order => order.status === 'paid').length,
      shipped: orders.filter(order => order.status === 'shipped').length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length,
    };

    return {
      totalRevenue,
      totalOrders,
      totalProductsSold,
      averageOrderValue,
      bestSellingProducts,
      dailySales,
      salesByStatus
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">No hay datos disponibles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics de Ventas</h1>
          <p className="mt-2 text-gray-600">
            Métricas y estadísticas de tus productos vendidos
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rango de fecha
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el tiempo</option>
            </select>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6l-2-2m0 0l-2 2m2-2v4m4-6h2m-2 2h2m4 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalProductsSold}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.averageOrderValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Ventas Diarias */}
            <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ventas Diarias 
                <span className="text-sm font-normal text-gray-600 ml-2">
                ({analytics.dailySales.length} días con ventas)
                </span>
            </h3>
            <div className="h-64">
                {analytics.dailySales.length > 0 ? (
                <>
                    {/* Leyenda del gráfico */}
                    <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                        Total período: {formatCurrency(
                        analytics.dailySales.reduce((sum, day) => sum + day.revenue, 0)
                        )}
                    </span>
                    <span className="text-sm text-gray-600">
                        {analytics.dailySales.reduce((sum, day) => sum + day.orders, 0)} órdenes
                    </span>
                    </div>

                    {/* Gráfico de barras */}
                    <div className="flex items-end justify-between h-40 space-x-2">
                    {analytics.dailySales.map((day, index) => {
                        // Calcular valores para el gráfico
                        const revenues = analytics.dailySales.map(d => d.revenue).filter(r => r > 0);
                        const maxRevenue = revenues.length > 0 ? Math.max(...revenues) : 1;
                        const dayRevenue = day.revenue || 0;
                        
                        // Calcular altura (mínimo 8px para que sea visible)
                        const baseHeight = 40; // altura base en px
                        const calculatedHeight = maxRevenue > 0 
                        ? (dayRevenue / maxRevenue) * baseHeight 
                        : 0;
                        const finalHeight = Math.max(calculatedHeight, 8);

                        return (
                        <div key={day.date} className="flex flex-col items-center flex-1 group">
                            {/* Barra del gráfico */}
                            <div 
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t hover:from-blue-600 hover:to-blue-700 transition-all duration-200 relative cursor-pointer"
                            style={{ height: `${finalHeight}px` }}
                            >
                            {/* Tooltip en hover */}
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                <div className="font-semibold">{formatCurrency(day.revenue)}</div>
                                <div>{day.orders} orden(es)</div>
                            </div>
                            </div>
                            
                            {/* Fecha */}
                            <span className="text-xs text-gray-500 mt-2 text-center leading-tight">
                            {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                            </span>
                        </div>
                        );
                    })}
                    </div>

                    {/* Información adicional debajo del gráfico */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Mejor día</p>
                        <p className="text-sm text-gray-900">
                        {formatCurrency(Math.max(...analytics.dailySales.map(d => d.revenue)))}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Promedio diario</p>
                        <p className="text-sm text-gray-900">
                        {formatCurrency(
                            analytics.dailySales.reduce((sum, day) => sum + day.revenue, 0) / analytics.dailySales.length
                        )}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Días activos</p>
                        <p className="text-sm text-gray-900">
                        {analytics.dailySales.filter(d => d.revenue > 0).length}/{analytics.dailySales.length}
                        </p>
                    </div>
                    </div>
                </>
                ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-400 mb-2">Sin datos de ventas</p>
                    <p className="text-sm text-gray-400 text-center max-w-md">
                    No hay registros de ventas para el período seleccionado. 
                    Las ventas aparecerán aquí automáticamente cuando recibas órdenes.
                    </p>
                </div>
                )}
            </div>
            </div>

          {/* Estados de Órdenes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estados de Órdenes</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Pagadas</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{analytics.salesByStatus.paid}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(analytics.salesByStatus.paid / analytics.totalOrders) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Enviadas</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{analytics.salesByStatus.shipped}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(analytics.salesByStatus.shipped / analytics.totalOrders) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Entregadas</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{analytics.salesByStatus.delivered}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(analytics.salesByStatus.delivered / analytics.totalOrders) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Canceladas</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{analytics.salesByStatus.cancelled}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(analytics.salesByStatus.cancelled / analytics.totalOrders) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos Más Vendidos */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
          </div>
          <div className="overflow-hidden">
            {analytics.bestSellingProducts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {analytics.bestSellingProducts.map((product, index) => (
                  <div key={product.productId} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.productName}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-2xl">#{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {product.totalQuantity} unidades vendidas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(product.totalRevenue)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {product.ordersCount} órdenes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay datos de productos vendidos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}