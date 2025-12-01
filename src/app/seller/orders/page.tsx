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
  doc,
  updateDoc 
} from "firebase/firestore";
import Link from "next/link";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variantDescription: string;
  status: string;
  sellerId: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: any;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  orderTotal: number;
  shippingAddress: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
    phone: string;
  };
  status: string;
  paymentStatus: string;
  shippingCost: number;
}

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Cargar órdenes del vendedor
  useEffect(() => {
    const fetchSellerOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("🔄 Cargando órdenes para vendedor:", user.uid);

        const ordersRef = collection(db, "sellers", user.uid, "orders");
        const q = query(ordersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data()
          } as Order);
        });

        console.log("✅ Órdenes cargadas:", ordersData.length);
        setOrders(ordersData);
      } catch (error) {
        console.error("❌ Error cargando órdenes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerOrders();
  }, [user]);

  // Actualizar estado de la orden
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return;

    try {
      setUpdatingOrder(orderId);
      
      // Actualizar en la subcolección del vendedor
      const sellerOrderRef = doc(db, "sellers", user.uid, "orders", orderId);
      await updateDoc(sellerOrderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // También actualizar en la orden principal (opcional, para consistencia)
      const mainOrderRef = doc(db, "orders", orderId);
      await updateDoc(mainOrderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // Actualizar estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      console.log("✅ Estado actualizado:", orderId, newStatus);
    } catch (error) {
      console.error("❌ Error actualizando orden:", error);
      alert("Error al actualizar el estado de la orden");
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  // Calcular estadísticas
  const stats = {
    total: orders.length,
    paid: orders.filter(order => order.status === "paid").length,
    shipped: orders.filter(order => order.status === "shipped").length,
    delivered: orders.filter(order => order.status === "delivered").length,
  };

  // Formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha no disponible";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Obtener color según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener texto en español para estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'shipped': return 'Enviada';
      case 'delivered': return 'Entregada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando órdenes...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Órdenes de Clientes</h1>
          <p className="mt-2 text-gray-600">
            Gestiona y realiza seguimiento a las órdenes de tus productos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{stats.total}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{stats.paid}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{stats.shipped}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{stats.delivered}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entregadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg border ${
              filter === "all" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`px-4 py-2 rounded-lg border ${
              filter === "paid" 
                ? "bg-yellow-600 text-white border-yellow-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Pagadas ({stats.paid})
          </button>
          <button
            onClick={() => setFilter("shipped")}
            className={`px-4 py-2 rounded-lg border ${
              filter === "shipped" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Enviadas ({stats.shipped})
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-4 py-2 rounded-lg border ${
              filter === "delivered" 
                ? "bg-green-600 text-white border-green-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Entregadas ({stats.delivered})
          </button>
        </div>

        {/* Lista de Órdenes */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "all" ? "No hay órdenes" : `No hay órdenes ${getStatusText(filter).toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === "all" 
                ? "Aún no has recibido órdenes para tus productos." 
                : `No tienes órdenes con estado "${getStatusText(filter).toLowerCase()}".`}
            </p>
            <Link 
              href="/seller/products"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Gestionar Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Header de la Orden */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Orden #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${order.orderTotal.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Cliente</h4>
                      <p className="text-sm text-gray-600">
                        {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{order.customerInfo?.email}</p>
                      <p className="text-sm text-gray-600">{order.customerInfo?.phone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Dirección de Envío</h4>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.address_1}, {order.shippingAddress.city}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.province}, {order.shippingAddress.postal_code}
                      </p>
                      <p className="text-sm text-gray-600">{order.shippingAddress.country_code}</p>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Productos</h4>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-600">{item.variantDescription}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Actualizar estado:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrder === order.id}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="paid">Pagada</option>
                        <option value="shipped">Enviada</option>
                        <option value="delivered">Entregada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                      {updatingOrder === order.id && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        Envío: ${order.shippingCost.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          // Aquí puedes implementar la funcionalidad de contacto
                          const phone = order.customerInfo?.phone || order.shippingAddress.phone;
                          if (phone) {
                            window.open(`https://wa.me/${phone}`, '_blank');
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Contactar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}