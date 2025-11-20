'use client'
// pages/seller/dashboard.tsx
import { useState, useEffect } from 'react';
import { useSellerAuth } from '@/hooks/useSellerAuth';
import SellerLayout from '@/components/seller/SellerLayout';
import SellerAuth from '@/components/seller/SellerAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import Link from 'next/link';

const SellerDashboard = () => {
  const { user, isSeller, loading } = useSellerAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    monthlySales: 0
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && isSeller) {
      fetchDashboardData();
    }
  }, [user, isSeller]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;

    try {
      // Por ahora, como no tienes productos, usamos datos de ejemplo
      // Más adelante puedes reemplazar esto con consultas reales
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        monthlySales: 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isSeller) {
    return <SellerAuth />;
  }

  return (
    <SellerLayout storeName={user.storeName}>
      {/* Bienvenida */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido, {user.name}!</h1>
        <p className="text-gray-600">Estás listo para comenzar a vender en E-Tianguis</p>
      </div>

      {/* Estado de la tienda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🚀</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-900">Tu tienda está casi lista</h3>
            <p className="text-blue-700">
              Configura tu tienda y añade tus primeros productos para comenzar a vender.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600">🏪</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estado de la Tienda</p>
              <p className="text-lg font-semibold text-gray-900">Activa</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">📧</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Email Verificado</p>
              <p className="text-lg font-semibold text-gray-900">Sí</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Miembro desde</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guía de primeros pasos */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Primeros Pasos</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Configurar tu tienda</h3>
                  <p className="text-sm text-gray-600">Añade logo, descripción y información de contacto</p>
                </div>
              </div>
              <Link 
                href="/seller/store" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                Configurar
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Añadir productos</h3>
                  <p className="text-sm text-gray-600">Comienza subiendo tus primeros productos para vender</p>
                </div>
              </div>
              <Link 
                href="/seller/products" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                Añadir Productos
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Ver tu tienda pública</h3>
                  <p className="text-sm text-gray-600">Revisa cómo ven los clientes tu tienda</p>
                </div>
              </div>
              <button 
                onClick={() => window.open(`/store/${user.storeName.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Ver Tienda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-indigo-600 text-xl">🛍️</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Gestionar Productos</h3>
          <p className="text-sm text-gray-600 mb-4">Añade, edita o elimina productos de tu catálogo</p>
          <Link 
            href="/seller/products" 
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 block"
          >
            Ir a Productos
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl">🏪</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Personalizar Tienda</h3>
          <p className="text-sm text-gray-600 mb-4">Configura la apariencia e información de tu tienda</p>
          <Link 
            href="/seller/store" 
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 block"
          >
            Configurar Tienda
          </Link>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;