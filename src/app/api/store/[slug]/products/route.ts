/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/store/[slug]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    console.log('🔍 Iniciando búsqueda para slug:', context.params);

    const { slug } = await context.params;
    console.log('🔄 Slug recibido:', slug);

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required" },
        { status: 400 }
      );
    }

    // Obtener TODOS los usuarios
    // console.log('📋 Obteniendo todos los usuarios...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    // console.log(`👥 Total de usuarios: ${usersSnapshot.size}`);

    // Buscar case-insensitive
    const foundUser = usersSnapshot.docs.find(doc => {
      const userData = doc.data();
      const storeName = userData.storeName;

      /* console.log(`🔍 Revisando usuario: ${doc.id}`, {
        storeName: storeName,
        buscando: slug
      }); */

      if (!storeName) return false;

      return storeName.toLowerCase() === slug.toLowerCase();
    });

    if (!foundUser) {
      console.log('❌ No se encontró tienda:', slug);

      const availableStores = usersSnapshot.docs
        .filter(doc => doc.data().storeName)
        .map(doc => doc.data().storeName);

      // console.log('🏪 Tiendas disponibles:', availableStores);

      return NextResponse.json(
        {
          error: `No se encontró la tienda "${slug}"`,
          available_stores: availableStores
        },
        { status: 404 }
      );
    }

    const userData = foundUser.data();
    const sellerId = foundUser.id;

    console.log('✅ Tienda encontrada:', userData.storeName);

    // Buscar productos
    console.log('🔍 Buscando productos para seller:', sellerId);
    let products = [];

    try {
      const productsQuery = query(
        collection(db, 'stores', 'Tienda', 'products'),
        where('status', '==', 'published'),
        where('seller_id', '==', sellerId)
      );

      const productsSnapshot = await getDocs(productsQuery);
      products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // console.log(`✅ ${products.length} productos encontrados`);

    } catch (error: any) {
      console.error('❌ Error en productos:', error);
      return NextResponse.json(
        {
          error: "Error accediendo a los productos",
          details: error.message
        },
        { status: 500 }
      );
    }

    const response = {
      products,
      count: products.length,
      store_info: {
        id: sellerId,
        name: userData.storeName,
        description: userData.storeDescription,
        email: userData.email,
        phone: userData.storePhone || userData.phoneNumber,
        address: userData.address
      }
    };

    console.log('🎯 Enviando respuesta exitosa');
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error general en endpoint:', error);

    // Asegurar que siempre devolvemos JSON
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}