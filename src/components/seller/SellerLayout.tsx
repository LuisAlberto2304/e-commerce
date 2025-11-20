// components/seller/SellerLayout.tsx
'use client';

import { ReactNode, useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SellerLayoutProps {
  children: ReactNode;
  storeName?: string;
}

const SellerLayout = ({ children, storeName }: SellerLayoutProps) => {
  const auth = getAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async (): Promise<void> => {
    await signOut(auth);
  };

  const isActive = (path: string): boolean => {
    return pathname === path;
  };

  const menuItems = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/seller/products', label: 'Productos', icon: '🛍️' },
    { path: '/seller/orders', label: 'Pedidos', icon: '📦' },
    { path: '/seller/analytics', label: 'Analíticas', icon: '📈' },
    { path: '/seller/store', label: 'Mi Tienda', icon: '🏪' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móviles */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-lg font-semibold">Panel Vendedor</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive(item.path)
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-4 text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Cerrar Sesión
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="flex">
        {/* Sidebar para desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-lg font-semibold text-gray-900">Panel Vendedor</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.path)
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Cerrar Sesión
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="md:pl-64 flex flex-col flex-1">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex justify-between items-center py-4 px-4 sm:px-6 md:px-8">
              <div className="flex items-center">
                <button
                  type="button"
                  className="md:hidden bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Abrir sidebar</span>
                  ☰
                </button>
                <div className="ml-4 md:ml-0">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {storeName || 'Mi Tienda'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.open(`/store/${storeName?.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Ver mi tienda pública
                </button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;