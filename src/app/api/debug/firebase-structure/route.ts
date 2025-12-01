/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/debug/firebase-simple/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando debug simple de Firebase...');

    const results: any = {};

    // 1. Verificar colección 'users'
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      results.users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      console.log('✅ Users encontrados:', results.users.length);
    } catch (error: any) {
      results.users_error = error.message;
      console.log('❌ Error en users:', error.message);
    }

    // 2. Verificar colección 'stores'
    try {
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      results.stores = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      console.log('✅ Stores encontrados:', results.stores.length);

      // Verificar productos en cada store
      for (const store of results.stores) {
        try {
          const productsSnapshot = await getDocs(collection(db, 'stores', store.id, 'products'));
          results[`stores_${store.id}_products`] = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }));
          console.log(`✅ Productos en stores/${store.id}/products:`, productsSnapshot.size);
        } catch (error: any) {
          results[`stores_${store.id}_products_error`] = error.message;
        }
      }
    } catch (error: any) {
      results.stores_error = error.message;
      console.log('❌ Error en stores:', error.message);
    }

    // 3. Verificar directamente stores/Tienda/products
    try {
      const tiendaProductsSnapshot = await getDocs(collection(db, 'stores', 'Tienda', 'products'));
      results.tienda_products = tiendaProductsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      console.log('✅ Productos en Tienda:', results.tienda_products.length);
    } catch (error: any) {
      results.tienda_products_error = error.message;
      console.log('❌ Error en Tienda products:', error.message);
    }

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        total_users: results.users?.length || 0,
        total_stores: results.stores?.length || 0,
        total_tienda_products: results.tienda_products?.length || 0
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error en debug simple:', error);
    return NextResponse.json(
      { 
        error: "Debug failed", 
        details: error.message
      },
      { status: 500 }
    );
  }
}