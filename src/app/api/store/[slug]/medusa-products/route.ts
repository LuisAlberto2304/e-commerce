/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/store/[slug]/medusa-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = await params;
    
    console.log('🔄 Obteniendo productos Medusa para store slug:', slug);

    // 1. Buscar la tienda por slug
    const storesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'seller')
    );
    
    const storesSnapshot = await getDocs(storesQuery);
    const store = storesSnapshot.docs.find(doc => {
      const storeData = doc.data();
      const storeName = storeData.storeName;
      const storeSlug = storeName.toLowerCase().replace(/\s+/g, '-');
      return storeSlug === slug.toLowerCase();
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    const storeData = store.data();
    const firebaseSellerId = storeData.uid;
    console.log('✅ Store encontrada - Firebase Seller ID:', firebaseSellerId);

    // 2. Buscar el Medusa Seller ID en Firebase
    let medusaSellerId = null;
    
    // Intentar encontrar en la colección de sellers o en metadata
    try {
      const sellerDoc = await getDoc(doc(db, 'sellers', firebaseSellerId));
      if (sellerDoc.exists()) {
        medusaSellerId = sellerDoc.data().medusa_seller_id;
        console.log('🔗 Medusa Seller ID encontrado en sellers collection:', medusaSellerId);
      }
    } catch (error) {
      console.log('⚠️ No se encontró en sellers collection, buscando en user metadata...');
    }

    // Si no se encontró, buscar en el metadata del usuario
    if (!medusaSellerId) {
      const userDoc = await getDoc(doc(db, 'users', firebaseSellerId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        medusaSellerId = userData.medusa_seller_id || userData.metadata?.medusa_seller_id;
        console.log('🔗 Medusa Seller ID encontrado en user metadata:', medusaSellerId);
      }
    }

    if (!medusaSellerId) {
      console.log('❌ No se pudo encontrar el Medusa Seller ID');
      return NextResponse.json({
        products: [],
        count: 0,
        error: "No se pudo encontrar el ID de Medusa para este seller",
        firebase_seller_id: firebaseSellerId
      }, { status: 200 });
    }

    console.log('🎯 Usando Medusa Seller ID:', medusaSellerId);

    // 3. Obtener productos de Medusa usando el endpoint corregido
    const medusaToken = process.env.NEXT_PUBLIC_MEDUSA_TOKEN;
    
    if (!medusaToken) {
      throw new Error('Medusa token not configured');
    }

    const medusaResponse = await fetch(`${request.nextUrl.origin}/api/medusa/store-products?sellerId=${medusaSellerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${medusaToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!medusaResponse.ok) {
      const errorData = await medusaResponse.json();
      throw new Error(errorData.error || `Medusa API error: ${medusaResponse.status}`);
    }

    const medusaData = await medusaResponse.json();
    
    console.log(`✅ ${medusaData.products?.length || 0} productos obtenidos de Medusa`);

    return NextResponse.json({
      products: medusaData.products || [],
      count: medusaData.products?.length || 0,
      seller_id: firebaseSellerId,
      medusa_seller_id: medusaSellerId,
      store_name: storeData.storeName,
      store_slug: slug
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error obteniendo productos Medusa:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}