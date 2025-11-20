'use client'
// pages/admin/orders.tsx
import { useState } from 'react';
import { useAuth } from '@/context/userContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAuth from '@/components/auth/AdminAuth';
import OrdersTable from '@/components/admin/OrdersTable';
import OrderDetails from '@/components/admin/OrderDetails';
import { Order } from '@/app/types/order';

const AdminOrders = () => {
  const { user, isAdmin, loading } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminAuth />;
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
          <p className="text-gray-600 mt-2">Administra y visualiza todas las órdenes de tu e-commerce</p>
        </div>
        
        <OrdersTable onOrderSelect={setSelectedOrder} />
        
        {selectedOrder && (
          <OrderDetails 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;