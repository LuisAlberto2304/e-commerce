/* eslint-disable @typescript-eslint/no-explicit-any */
// app/seller/products/page.tsx
'use client';

import { useState } from 'react';
import { useSellerAuth } from '../../../hooks/useSellerAuth';
import { useMedusa } from '../../../hooks/useMedusaAuth'; // Tu hook actual
import AddProductModal from '../../../components/AddProductModal';

export default function SellerProductsPage() {
  const { user, isSeller, loading: authLoading } = useSellerAuth();
  const { createProduct } = useMedusa(); // Solo tenemos createProduct
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasProducts = products.length > 0;

  // Función para manejar la creación de productos
  const handleCreateProduct = async (productData: any, storeId: string, userId: string, userEmail: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Creando producto...');
      
      // Validaciones básicas
      if (!productData.title?.trim()) {
        throw new Error('El título del producto es requerido');
      }

      if (!productData.thumbnail?.trim()) {
        throw new Error('La imagen principal es requerida');
      }

      const validVariants = productData.variants.filter((variant: any) => 
        variant.title?.trim() && variant.price > 0 && variant.quantity >= 0
      );

      if (validVariants.length === 0) {
        throw new Error('Debe agregar al menos una variante válida');
      }

      // Preparar datos para Medusa
      const medusaProductData = {
        ...productData,
        variants: validVariants
      };

      console.log('📤 Enviando a Medusa...', medusaProductData);

      // Usar el createProduct de tu hook
      const result = await createProduct(medusaProductData);
      
      if (!result) {
        throw new Error('No se pudo crear el producto - respuesta vacía');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✅ Producto creado exitosamente:', result);

      // Opcional: Guardar en Firebase si lo necesitas
      // await saveToFirebase(result, storeId, userId);

      return result;

    } catch (err: any) {
      console.error('💥 Error creando producto:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isSeller || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos de vendedor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600">Gestiona tu catálogo de productos</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {hasProducts ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <p>Tienes {products.length} productos en tu tienda.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛍️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no tienes productos</h3>
            <p className="text-gray-600 mb-6">
              Comienza añadiendo tu primer producto para vender en tu tienda.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Crear Primer Producto
            </button>
          </div>
        </div>
      )}

      {/* Información de la tienda */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Información de tu tienda</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Email de contacto:</span>
            <p className="text-blue-700">{user.email}</p>
          </div>
          <div>
            <span className="font-medium">Estado:</span>
            <p className="text-blue-700">Activa ✅</p>
          </div>
        </div>
      </div>

      {/* Modal para agregar productos */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductCreated={() => {
          console.log('Producto creado exitosamente');
          // Aquí puedes actualizar la lista de productos
        }}
        storeId={user.storeName || ''}
        userId={user.uid}
        userEmail={user.email}
        createProduct={handleCreateProduct}
        loading={loading}
        error={error}
        clearError={clearError}
      />
    </div>
  );
}