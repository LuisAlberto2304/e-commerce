/* eslint-disable @typescript-eslint/no-explicit-any */
// app/seller/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSellerAuth } from '../../../hooks/useSellerAuth';
import { useMedusa } from '../../../hooks/useMedusaAuth';
import AddProductModal from '../../../components/AddProductModal';
import EditProductModal from '../../../components/EditProductModal';
import { useFirebaseSync } from '@/hooks/useFirebaseSync';

export default function SellerProductsPage() {
  const { user, isSeller, loading: authLoading } = useSellerAuth();
  const { createProduct, getSellerProducts, updateProduct } = useMedusa();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { syncProductToFirebase } = useFirebaseSync();

  const hasProducts = products.length > 0;

  // Función para cargar los productos del seller
  const fetchSellerProducts = async () => {
    if (!user) return;
    
    setLoadingProducts(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando productos del seller...');
      
      const result = await getSellerProducts();
      
      if (result && !result.error) {
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(result)) {
          setProducts(result);
        } 
        else if (result.products && Array.isArray(result.products)) {
          setProducts(result.products);
        }
        else if (result.data && Array.isArray(result.data)) {
          setProducts(result.data);
        }
        else {
          console.log('📦 Formato de respuesta:', result);
          setProducts([]);
        }
        
        console.log(`✅ ${products.length} productos cargados`);
      } else {
        throw new Error(result?.error || 'Error al cargar productos');
      }
    } catch (err: any) {
      console.error('💥 Error cargando productos:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  

  // Cargar productos al montar el componente
  useEffect(() => {
    if (user && isSeller) {
      fetchSellerProducts();
    }
  }, [user, isSeller]);

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

      // 1. Crear producto en Medusa
      const result = await createProduct(medusaProductData);
      
      console.log('📨 Respuesta completa de Medusa:', JSON.stringify(result, null, 2));
      
      if (!result) {
        throw new Error('No se pudo crear el producto - respuesta vacía');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Verificar la estructura de la respuesta
      console.log('🔍 Estructura de la respuesta:');
      console.log('Tiene ID?:', !!result.id);
      console.log('Tiene product?:', !!result.product);
      console.log('Tiene data?:', !!result.data);
      console.log('Keys del objeto:', Object.keys(result));

      // Buscar el ID en diferentes ubicaciones posibles
      const productId = result.id || result.product?.id || result.data?.id;
      console.log('🆔 ID encontrado:', productId);

      if (!productId) {
        console.warn('⚠️ Medusa no retornó un ID explícito, pero el producto se creó');
        console.log('Respuesta completa:', result);
      }

      console.log('✅ Producto procesado en Medusa:', result);

      // 2. Sincronizar con Firebase (solo si tenemos un ID)
      if (productId) {
        try {
          console.log('🔄 Sincronizando con Firebase...');
          
          // Crear un objeto de producto con el ID
          const productWithId = {
            ...result,
            id: productId // Asegurar que tenga ID
          };
          
          await syncProductToFirebase(productWithId, userId, storeId);
          console.log('✅ Producto sincronizado con Firebase');
        } catch (firebaseError) {
          console.error('⚠️ Error en Firebase:', firebaseError);
          // No bloquear el flujo principal
        }
      } else {
        console.warn('⚠️ No se pudo sincronizar con Firebase porque no hay ID del producto');
      }

      // 3. Recargar la lista de productos después de crear uno nuevo
      await fetchSellerProducts();

      return result;

    } catch (err: any) {
      console.error('💥 Error creando producto:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la actualización de productos
  const handleUpdateProduct = async (productId: string, productData: any) => {
    setUpdateLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Actualizando producto...', productId, productData);
      
      // Validaciones básicas
      if (!productData.title?.trim()) {
        throw new Error('El título del producto es requerido');
      }

      if (!productData.thumbnail?.trim()) {
        throw new Error('La imagen principal es requerida');
      }

      // Usar el updateProduct de tu hook
      const result = await updateProduct(productId, productData);
      
      if (!result) {
        throw new Error('No se pudo actualizar el producto - respuesta vacía');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✅ Producto actualizado exitosamente:', result);

      // Recargar la lista de productos después de actualizar
      await fetchSellerProducts();

      return result;

    } catch (err: any) {
      console.error('💥 Error actualizando producto:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Función para abrir el modal de edición
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const clearError = () => {
    setError(null);
  };

  // Función para formatear el precio
  const formatPrice = (amount: number, currencyCode: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount / 100);
  };

  // Función para obtener el estado del producto
  const getProductStatus = (status: string) => {
    const statusMap: any = {
      'published': { text: 'Publicado', color: 'text-green-600 bg-green-100' },
      'draft': { text: 'Borrador', color: 'text-gray-600 bg-gray-100' },
      'proposed': { text: 'Propuesto', color: 'text-blue-600 bg-blue-100' },
      'rejected': { text: 'Rechazado', color: 'text-red-600 bg-red-100' }
    };
    
    return statusMap[status] || { text: status, color: 'text-gray-600 bg-gray-100' };
  };

  

  if (authLoading || loadingProducts) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando productos...</div>
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {hasProducts ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Tus Productos ({products.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {products.map((product) => {
              const status = getProductStatus(product.status);
              const mainVariant = product.variants?.[0];
              
              return (
                <div key={product.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {product.thumbnail && (
                        <img 
                          src={product.thumbnail} 
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{product.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          {mainVariant && (
                            <span className="text-sm font-medium text-gray-900">
                              {formatPrice(mainVariant.prices?.[0]?.amount || 0)}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {product.variants?.length || 0} variante(s)
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {product.id.substring(0, 8)}...
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
          <div>
            <span className="font-medium">Total de productos:</span>
            <p className="text-blue-700">{products.length}</p>
          </div>
          <div>
            <span className="font-medium">Última actualización:</span>
            <p className="text-blue-700">{new Date().toLocaleDateString('es-MX')}</p>
          </div>
        </div>
      </div>

      {/* Modal para agregar productos */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductCreated={() => {
          console.log('Producto creado exitosamente');
          fetchSellerProducts();
        }}
        storeId={user.storeName || ''}
        userId={user.uid}
        userEmail={user.email}
        createProduct={handleCreateProduct}
        loading={loading}
        error={error}
        clearError={clearError}
      />

      {/* Modal para editar productos */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onProductUpdated={() => {
          console.log('Producto actualizado exitosamente');
          fetchSellerProducts();
        }}
        product={selectedProduct}
        updateProduct={handleUpdateProduct}
        loading={updateLoading}
        error={error}
        clearError={clearError}
      />
    </div>
  );
}