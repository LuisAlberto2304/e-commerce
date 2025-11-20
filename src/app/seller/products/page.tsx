// app/seller/products/page.tsx
'use client';

import { useSellerAuth } from '../../../hooks/useSellerAuth';
import Link from 'next/link';

export default function SellerProductsPage() {
  const { user } = useSellerAuth();

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600">Gestiona tu catálogo de productos</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estado vacío */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🛍️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no tienes productos</h3>
          <p className="text-gray-600 mb-6">
            Comienza añadiendo tu primer producto para vender en tu tienda.
          </p>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            Crear Primer Producto
          </button>
          <div className="mt-6 text-sm text-gray-500">
            <p>Próximamente podrás:</p>
            <ul className="mt-2 space-y-1">
              <li>• Añadir imágenes y descripciones de productos</li>
              <li>• Gestionar inventario y precios</li>
              <li>• Organizar productos por categorías</li>
              <li>• Crear variantes de productos (tallas, colores, etc.)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Información de la tienda */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Información de tu tienda</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombre de la tienda:</span>
            <p className="text-blue-700">{user?.storeName}</p>
          </div>
          <div>
            <span className="font-medium">Email de contacto:</span>
            <p className="text-blue-700">{user?.email}</p>
          </div>
          <div>
            <span className="font-medium">Fecha de registro:</span>
            <p className="text-blue-700">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : 'N/A'}
            </p>
          </div>
          <div>
            <span className="font-medium">Estado:</span>
            <p className="text-blue-700">Activa ✅</p>
          </div>
        </div>
      </div>
    </div>
  );
}