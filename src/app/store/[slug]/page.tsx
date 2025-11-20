// app/store/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import { SellerProfile } from '@/app/types/seller';
import Link from 'next/link';

// Función para buscar tienda case-insensitive
async function findStoreBySlug(slug: string): Promise<SellerProfile | null> {
  try {
    const storeNameFromSlug = decodeURIComponent(slug).replace(/-/g, ' ');
    console.log('🔍 Buscando tienda:', storeNameFromSlug);

    // Obtener TODAS las tiendas seller
    const storesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'seller')
    );
    
    const storesSnapshot = await getDocs(storesQuery);
    console.log('📊 Total de tiendas seller:', storesSnapshot.size);

    // Buscar case-insensitive - SIN TIPOS EXPLÍCITOS para evitar conflictos
    const foundStore = storesSnapshot.docs.find(doc => {
      const storeData = doc.data();
      const storeName = storeData.storeName;
      
      // Comparación case-insensitive
      const matches = storeName.toLowerCase() === storeNameFromSlug.toLowerCase();
      
      if (matches) {
        console.log('✅ Coincidencia encontrada:');
        console.log('   - En Firebase:', storeName);
        console.log('   - En URL:', storeNameFromSlug);
      }
      
      return matches;
    });

    if (!foundStore) {
      console.log('❌ No se encontró coincidencia');
      
      // Mostrar todas las tiendas disponibles para debug - SIN TIPOS EXPLÍCITOS
      console.log('🏪 Tiendas disponibles:');
      storesSnapshot.docs.forEach((doc, index) => {
        const store = doc.data();
        console.log(`   ${index + 1}. "${store.storeName}" (${store.email})`);
      });
      
      return null;
    }

    const storeData = foundStore.data();
    console.log('🎯 Tienda encontrada:', storeData);

    // Validar y convertir
    return validateSellerProfile(storeData);

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    return null;
  }
}

// Función para validar y convertir datos
function validateSellerProfile(data: DocumentData): SellerProfile | null {
  try {
    if (!data.uid || !data.email || !data.name || !data.role || !data.storeName || !data.createdAt || !data.updatedAt) {
      console.warn('Datos de seller incompletos:', data);
      return null;
    }

    return {
      uid: data.uid,
      email: data.email,
      name: data.name,
      role: data.role,
      storeName: data.storeName,
      storeDescription: data.storeDescription || '',
      storeLogo: data.storeLogo,
      storeBanner: data.storeBanner,
      storeAddress: data.storeAddress,
      storePhone: data.storePhone,
      storeSocialMedia: data.storeSocialMedia,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      rating: data.rating,
      totalSales: data.totalSales,
      totalProducts: data.totalProducts,
      isActive: data.isActive !== undefined ? data.isActive : true,
      storeSlug: data.storeSlug
    };
  } catch (error) {
    console.error('Error validando seller profile:', error);
    return null;
  }
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [store, setStore] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      const foundStore = await findStoreBySlug(slug);
      
      if (!foundStore) {
        setError(`No se encontró la tienda "${decodeURIComponent(slug).replace(/-/g, ' ')}"`);
        setStore(null);
        return;
      }

      setStore(foundStore);

    } catch (error) {
      console.error('❌ Error fetching store data:', error);
      setError('Error al cargar la tienda');
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">Buscando tienda...</p>
          <p className="text-sm text-gray-500">Slug: {slug}</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            URL intentada: <code>/store/{slug}</code>
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la tienda */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{store.storeName}</h1>
            
            {store.storeDescription && (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
                {store.storeDescription}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mt-4">
              {store.storePhone && (
                <div className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span>{store.storePhone}</span>
                </div>
              )}
              
              {store.storeAddress && (
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span>{store.storeAddress}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="mr-2">🛒</span>
                <span>Vendiendo desde {new Date(store.createdAt).getFullYear()}</span>
              </div>

              {store.email && (
                <div className="flex items-center">
                  <span className="mr-2">✉️</span>
                  <span>{store.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-green-600 text-8xl mb-6">✅</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Tienda encontrada!</h3>
          <p className="text-gray-600 text-lg mb-2">
            Nombre exacto: <strong>{store.storeName}</strong>
          </p>
          <p className="text-gray-600 text-lg mb-8">
            Esta tienda existe y está activa.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="font-semibold text-green-900 mb-3">Estado de la tienda</h4>
            <p className="text-green-700 text-sm">
              ✅ La tienda <strong>{store.storeName}</strong> está registrada correctamente.
            </p>
            <p className="text-green-700 text-sm mt-2">
              Próximamente podrás agregar productos para vender.
            </p>
          </div>
        </div>

        {/* Información del vendedor */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Información del Vendedor</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contacto</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-24 font-medium">Vendedor:</span>
                    <span>{store.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 font-medium">Email:</span>
                    <span>{store.email}</span>
                  </div>
                  {store.storePhone && (
                    <div className="flex items-center">
                      <span className="w-24 font-medium">Teléfono:</span>
                      <span>{store.storePhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tienda</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-24 font-medium">Registrada:</span>
                    <span>
                      {new Date(store.createdAt).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 font-medium">Estado:</span>
                    <span className="flex items-center text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Activa
                    </span>
                  </div>
                  {store.storeAddress && (
                    <div className="flex items-start">
                      <span className="w-24 font-medium mt-1">Ubicación:</span>
                      <span>{store.storeAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje para el vendedor */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm text-center">
              <strong>¿Eres el dueño de esta tienda?</strong>{' '}
              <Link 
                href="/seller/dashboard" 
                className="text-blue-900 underline hover:text-blue-700"
              >
                Inicia sesión en tu panel
              </Link>{' '}
              para gestionar tus productos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}