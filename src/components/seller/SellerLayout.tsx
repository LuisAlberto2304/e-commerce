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

  const isActive = (path: string): boolean => pathname === path;

  const menuItems = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/seller/products', label: 'Productos', icon: '🛍️' },
    { path: '/seller/orders', label: 'Pedidos', icon: '📦' },
    { path: '/seller/analytics', label: 'Analíticas', icon: '📈' },
    { path: '/seller/store', label: 'Mi Tienda', icon: '🏪' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------ */}
      {/* 📱 Sidebar móvil - Slide in   */}
      {/* ------------------------------ */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div
          className={`absolute left-0 top-0 h-full w-64 bg-white mt-29 shadow-xl transform transition-transform duration-300 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="px-4 py-5 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Panel Vendedor</h1>
            <button className="text-gray-500 p-2" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors
                  ${isActive(item.path)
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ------------------------------ */}
      {/* 🖥 Sidebar desktop fijo        */}
      {/* ------------------------------ */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full mt-32">
          <div className="px-4 py-5 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Panel Vendedor</h1>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${isActive(item.path)
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ---------------------------------- */}
      {/* 📄 Contenido principal + Header     */}
      {/* ---------------------------------- */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex justify-between items-center py-3 px-4 sm:px-6 md:px-8">
            <div className="flex items-center">
              {/* Botón menú móvil */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                ☰
              </button>

              <h1 className="ml-3 md:ml-4 text-lg font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-none">
                {storeName || 'Mi Tienda'}
              </h1>
            </div>

            <button
              onClick={() =>
                window.open(`/store/${storeName?.toLowerCase().replace(/\s+/g, '-')}`, '_blank')
              }
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium px-3 py-1.5 bg-indigo-50 rounded-md"
            >
              Ver tienda
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 w-full overflow-y-auto">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
